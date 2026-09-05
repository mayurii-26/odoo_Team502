# ============================================================
# DealFlow360 - Recommendation Engine & Weight Config Test Suite
# Tests for UPSELL, CROSS-SELL, Dynamic Weights, and API Endpoints
# ============================================================
import os
import sys
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.models import (
    Product, ProductRelationship, Promotion, InventoryStock,
    HistoricalOrder, HistoricalOrderLine, Quotation, QuotationLine,
    Customer, RecommendationWeightConfig, RecommendationFeedback
)
from app.ai.recommendations import RecommendationEngine

client = TestClient(app)

@pytest.fixture(scope="function")
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

@pytest.fixture(autouse=True)
def ensure_q1042_pristine():
    session = SessionLocal()
    def _clean():
        q = session.query(Quotation).filter(Quotation.quote_number == "Q-1042").first()
        if q:
            # Delete any lines with id > 3
            lines = session.query(QuotationLine).filter(QuotationLine.quotation_id == q.id).all()
            for l in lines:
                if l.id > 3:
                    session.delete(l)
            session.flush()

            # Always ensure Line 1 is Laptop Pro 14 (product_id = 1)
            p14 = session.query(Product).filter(Product.id == 1).first()
            l1 = session.query(QuotationLine).filter(QuotationLine.id == 1).first()
            if l1:
                l1.product_id = p14.id
                l1.quantity = 2
                l1.unit_price = p14.unit_price
                l1.discount_percent = 12.0
                l1.discount_amount = round(2 * p14.unit_price * 0.12, 2)
                l1.line_subtotal = round(2 * p14.unit_price - l1.discount_amount, 2)
                l1.unit_cost = p14.cost_price
                l1.line_cost = round(2 * p14.cost_price, 2)
                l1.line_margin = round(l1.line_subtotal - l1.line_cost, 2)
                l1.line_margin_percent = 29.17

            # Recalculate quote totals
            lines = session.query(QuotationLine).filter(QuotationLine.quotation_id == q.id).all()
            q_sub = sum(l.quantity * l.unit_price for l in lines)
            q_disc = sum(l.discount_amount for l in lines)
            q_cost = sum(l.line_cost for l in lines)
            tax = round((q_sub - q_disc) * 0.08, 2)
            tot = round((q_sub - q_disc) + tax, 2)
            gross_margin = round((q_sub - q_disc) - q_cost, 2)
            net_rev = q_sub - q_disc
            q.subtotal = round(q_sub, 2)
            q.discount_amount = round(q_disc, 2)
            q.tax_amount = tax
            q.total_amount = tot
            q.total_cost = round(q_cost, 2)
            q.gross_margin = gross_margin
            q.margin_percent = round((gross_margin / net_rev) * 100, 2) if net_rev > 0 else 0.0
            session.commit()
    try:
        _clean()
        yield
    finally:
        _clean()
        session.close()


# ============================================================
# 1. UPSELL TESTS
# ============================================================

def test_upsell_higher_tier_detected_and_lower_tier_rejected(db):
    """
    Upsell engine must recommend higher-tier products in same family (e.g. Laptop Pro 16)
    and reject lower-tier or equal-tier products.
    """
    engine = RecommendationEngine(db)
    recs = engine.get_recommendations("Q-1042")
    upsell_candidates = recs["upsell"]

    assert len(upsell_candidates) > 0, "Expected at least 1 upsell candidate for Q-1042"

    # Verify all upsell candidates have tier > source product tier (1)
    src_prod = db.query(Product).filter(Product.name == "Laptop Pro 14").first()
    for u in upsell_candidates:
        cand_prod = db.query(Product).filter(Product.id == u["product_id"]).first()
        assert cand_prod.product_family == src_prod.product_family
        assert cand_prod.tier > src_prod.tier, f"{cand_prod.name} tier {cand_prod.tier} is not higher than {src_prod.tier}"

    # Verify lower/same tier product (Laptop Pro 14 itself or any tier <= 1) is never recommended
    cand_ids = [u["product_id"] for u in upsell_candidates]
    assert src_prod.id not in cand_ids, "Source product should not be recommended as an upsell to itself"

def test_upsell_upgrade_frequency_calculated_correctly(db):
    """
    Verify upgrade rate is calculated using unique customer history
    where upgrade happened AFTER the original purchase date.
    """
    engine = RecommendationEngine(db)
    recs = engine.get_recommendations("Q-1042")

    lp16 = next((u for u in recs["upsell"] if u["product_name"] == "Laptop Pro 16"), None)
    assert lp16 is not None
    # In seeded data, 8 customers bought Laptop Pro 14, 3 later upgraded to Laptop Pro 16 -> 3/8 = 0.375 (38%)
    assert 0.30 <= lp16["upgrade_rate"] <= 0.45
    assert "38%" in lp16["reason"] or "37%" in lp16["reason"]

def test_upsell_same_order_purchase_not_counted_as_upgrade(db):
    """
    A customer who bought both Laptop Pro 14 and Laptop Pro 16 in the SAME order
    must NOT be counted as an upgrade.
    """
    # Create temporary same-order scenario
    order_date = datetime(2025, 3, 1, 10, 0, 0)
    ho = HistoricalOrder(
        order_number="ORD-TEST-SAMEORDER",
        customer_id=1,
        sales_rep_id=1,
        order_date=order_date,
        subtotal=2850.0,
        total_amount=2850.0,
        status="COMPLETED"
    )
    db.add(ho)
    db.flush()

    p14 = db.query(Product).filter(Product.name == "Laptop Pro 14").first()
    p16 = db.query(Product).filter(Product.name == "Laptop Pro 16").first()

    l1 = HistoricalOrderLine(
        historical_order_id=ho.id,
        product_id=p14.id,
        quantity=1,
        unit_price=1200.0,
        discount_percent=0.0,
        discount_amount=0.0,
        unit_cost=850.0,
        line_revenue=1200.0,
        line_cost=850.0,
        line_margin=350.0,
        line_margin_percent=29.17
    )
    l2 = HistoricalOrderLine(
        historical_order_id=ho.id,
        product_id=p16.id,
        quantity=1,
        unit_price=1450.0,
        discount_percent=0.0,
        discount_amount=0.0,
        unit_cost=1000.0,
        line_revenue=1450.0,
        line_cost=1000.0,
        line_margin=450.0,
        line_margin_percent=31.03
    )
    db.add_all([l1, l2])
    db.commit()

    # Re-evaluate recommendations
    engine = RecommendationEngine(db)
    recs = engine.get_recommendations("Q-1042")
    lp16 = next((u for u in recs["upsell"] if u["product_name"] == "Laptop Pro 16"), None)

    # Clean up test data
    db.delete(l1)
    db.delete(l2)
    db.delete(ho)
    db.commit()

    # Even with same-order purchase, customer 999 should NOT count as an upgrade
    assert lp16 is not None
    assert lp16["upgrade_rate"] <= 0.40

def test_upsell_margin_score_and_promotion_applied(db):
    """
    Verify margin delta is positive and active promotion is detected.
    """
    engine = RecommendationEngine(db)
    recs = engine.get_recommendations("Q-1042")
    lp16 = next((u for u in recs["upsell"] if u["product_name"] == "Laptop Pro 16"), None)

    assert lp16 is not None
    assert lp16["margin_delta"] > 0, "Upsell to Laptop Pro 16 must provide positive margin delta"
    assert lp16["promotion"] is not None
    assert lp16["promotion"]["discount_percent"] == 10

def test_upsell_stockout_excluded(db):
    """
    Physical product with available stock <= 0 must be excluded.
    """
    p16 = db.query(Product).filter(Product.name == "Laptop Pro 16").first()
    stock_records = db.query(InventoryStock).filter(InventoryStock.product_id == p16.id).all()
    orig_stocks = [(s.id, s.quantity_on_hand, s.quantity_reserved, s.quantity_available) for s in stock_records]

    # Temporarily set stock to 0
    for s in stock_records:
        s.quantity_on_hand = 0
        s.quantity_reserved = 0
        s.quantity_available = 0
    db.commit()

    engine = RecommendationEngine(db)
    recs = engine.get_recommendations("Q-1042")
    cand_names = [u["product_name"] for u in recs["upsell"]]

    # Restore stock
    for s_id, on_hand, reserved, avail in orig_stocks:
        s = db.query(InventoryStock).filter(InventoryStock.id == s_id).first()
        s.quantity_on_hand = on_hand
        s.quantity_reserved = reserved
        s.quantity_available = avail
    db.commit()

    assert "Laptop Pro 16" not in cand_names, "Laptop Pro 16 should have been excluded when out of stock"

# ============================================================
# 2. CROSS-SELL TESTS
# ============================================================

def test_cross_sell_co_purchase_frequency_calculated(db):
    """
    Co-purchase frequency calculated from historical orders containing source product.
    """
    engine = RecommendationEngine(db)
    recs = engine.get_recommendations("Q-1042")
    cross_candidates = recs["cross_sell"]

    assert len(cross_candidates) >= 3, "Expected at least 3 cross-sell candidates"

    mouse = next((c for c in cross_candidates if c["product_name"] == "Wireless Mouse"), None)
    dock = next((c for c in cross_candidates if c["product_name"] == "Docking Station"), None)

    assert mouse is not None, "Wireless Mouse should be recommended"
    assert dock is not None, "Docking Station should be recommended"
    assert mouse["co_purchase_rate"] > dock["co_purchase_rate"], "Mouse co-purchase rate should exceed Docking Station"
    assert "65%" in mouse["reason"] or "64%" in mouse["reason"]

def test_cross_sell_upgrade_products_not_treated_as_cross_sell(db):
    """
    Higher-tier products in same family must NOT appear as cross-sells.
    """
    engine = RecommendationEngine(db)
    recs = engine.get_recommendations("Q-1042")
    cross_names = [c["product_name"] for c in recs["cross_sell"]]

    assert "Laptop Pro 16" not in cross_names, "Laptop Pro 16 is an upsell, not a cross-sell"
    assert "Laptop Pro 18" not in cross_names, "Laptop Pro 18 is an upsell, not a cross-sell"

def test_cross_sell_stockout_excluded(db):
    """
    Out-of-stock cross-sell product must be excluded.
    """
    mouse = db.query(Product).filter(Product.name == "Wireless Mouse").first()
    stock_records = db.query(InventoryStock).filter(InventoryStock.product_id == mouse.id).all()
    orig_stocks = [(s.id, s.quantity_on_hand, s.quantity_reserved, s.quantity_available) for s in stock_records]

    for s in stock_records:
        s.quantity_on_hand = 0
        s.quantity_reserved = 0
        s.quantity_available = 0
    db.commit()

    engine = RecommendationEngine(db)
    recs = engine.get_recommendations("Q-1042")
    cross_names = [c["product_name"] for c in recs["cross_sell"]]

    # Restore stock
    for s_id, on_hand, reserved, avail in orig_stocks:
        s = db.query(InventoryStock).filter(InventoryStock.id == s_id).first()
        s.quantity_on_hand = on_hand
        s.quantity_reserved = reserved
        s.quantity_available = avail
    db.commit()

    assert "Wireless Mouse" not in cross_names, "Wireless Mouse should be excluded when stock is 0"

# ============================================================
# 3. DYNAMIC WEIGHTS & VALIDATION TESTS
# ============================================================

def test_weight_validation_sum_must_equal_100():
    """
    Attempting to save weights that do not sum to 100 must be rejected with
    'Recommendation weights must total 100%.'
    """
    bad_payload = {
        "upsell": {
            "upgrade_frequency": 40,
            "margin_opportunity": 20,
            "promotion": 20,
            "customer_affinity": 10,
            "stock_availability": 5  # sum = 95
        },
        "cross_sell": {
            "co_purchase_frequency": 35,
            "compatibility": 20,
            "promotion": 15,
            "margin_opportunity": 20,
            "stock_availability": 10
        }
    }
    r = client.put("/api/admin/recommendation-weights", json=bad_payload)
    assert r.status_code == 400
    assert r.json()["detail"] == "Recommendation weights must total 100%."

def test_weight_validation_bounds():
    """
    Weights < 0 or > 100 must be rejected.
    """
    bad_payload = {
        "upsell": {
            "upgrade_frequency": -10,
            "margin_opportunity": 50,
            "promotion": 30,
            "customer_affinity": 20,
            "stock_availability": 10
        },
        "cross_sell": {
            "co_purchase_frequency": 35,
            "compatibility": 20,
            "promotion": 15,
            "margin_opportunity": 20,
            "stock_availability": 10
        }
    }
    r = client.put("/api/admin/recommendation-weights", json=bad_payload)
    assert r.status_code == 400

def test_rankings_change_when_admin_weights_change(db):
    """
    Altering weights in database dynamically alters candidate scores and ranking.
    """
    # 1. Base weights: default
    r1 = client.get("/api/quotes/Q-1042/recommendations")
    base_score = next(u["score"] for u in r1.json()["upsell"] if u["product_name"] == "Laptop Pro 16")

    # 2. Boost upgrade_frequency weight to 70%
    new_weights = {
        "upsell": {
            "upgrade_frequency": 70,
            "margin_opportunity": 10,
            "promotion": 10,
            "customer_affinity": 5,
            "stock_availability": 5
        },
        "cross_sell": {
            "co_purchase_frequency": 60,
            "compatibility": 10,
            "promotion": 10,
            "margin_opportunity": 10,
            "stock_availability": 10
        }
    }
    r_put = client.put("/api/admin/recommendation-weights", json=new_weights)
    assert r_put.status_code == 200

    r2 = client.get("/api/quotes/Q-1042/recommendations")
    boosted_score = next(u["score"] for u in r2.json()["upsell"] if u["product_name"] == "Laptop Pro 16")

    # Restore default weights
    default_weights = {
        "upsell": {
            "upgrade_frequency": 35,
            "margin_opportunity": 25,
            "promotion": 20,
            "customer_affinity": 10,
            "stock_availability": 10
        },
        "cross_sell": {
            "co_purchase_frequency": 35,
            "compatibility": 20,
            "promotion": 15,
            "margin_opportunity": 20,
            "stock_availability": 10
        }
    }
    client.put("/api/admin/recommendation-weights", json=default_weights)

    assert boosted_score != base_score, f"Score should have changed from {base_score}, got {boosted_score}"

# ============================================================
# 4. QUOTATION ACTIONS: ADD TO QUOTE & DISMISS
# ============================================================

def test_add_to_quote_cross_sell(db):
    """
    Adding a cross-sell item creates a new line and recalculates subtotal, margin, etc.
    """
    # Clean up any leftover extra lines first
    quote = db.query(Quotation).filter(Quotation.quote_number == "Q-1042").first()
    extra_lines = db.query(QuotationLine).filter(QuotationLine.quotation_id == quote.id, QuotationLine.id > 3).all()
    for el in extra_lines:
        db.delete(el)
    
    # Recalculate original base values from first 3 lines
    base_lines = db.query(QuotationLine).filter(QuotationLine.quotation_id == quote.id).all()
    q_sub = sum(l.quantity * l.unit_price for l in base_lines)
    q_disc = sum(l.discount_amount for l in base_lines)
    quote.subtotal = round(q_sub, 2)
    quote.discount_amount = round(q_disc, 2)
    quote.tax_amount = round((q_sub - q_disc) * 0.08, 2)
    quote.total_amount = round((q_sub - q_disc) + quote.tax_amount, 2)
    db.commit()

    mouse = db.query(Product).filter(Product.name == "Wireless Mouse").first()
    orig_total = quote.total_amount
    orig_lines_count = len(base_lines)

    # Call Add Line API
    res = client.post("/api/quotes/Q-1042/lines", json={
        "product_id": mouse.id,
        "quantity": 1,
        "discount_percent": 0.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["total_amount"] > orig_total

    # Verify line was added
    db.expire_all()
    quote_updated = db.query(Quotation).filter(Quotation.quote_number == "Q-1042").first()
    lines_in_db = db.query(QuotationLine).filter(QuotationLine.quotation_id == quote_updated.id).all()
    assert len(lines_in_db) == orig_lines_count + 1

    # Cleanup the test line to keep Q-1042 in standard state
    new_line = lines_in_db[-1]
    db.delete(new_line)
    quote_updated.subtotal = quote.subtotal
    quote_updated.discount_amount = quote.discount_amount
    quote_updated.tax_amount = quote.tax_amount
    quote_updated.total_amount = orig_total
    db.commit()

def test_dismiss_feedback(db):
    """
    Dismiss action stores a record in recommendation_feedback.
    """
    res = client.post("/api/quotes/Q-1042/recommendations/feedback", json={
        "product_id": 18,
        "customer_id": 1,
        "user_id": 2,
        "recommendation_type": "CROSS_SELL",
        "action": "DISMISSED",
        "reason": "Not needed for this project"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "success"

    fb = db.query(RecommendationFeedback).filter(
        RecommendationFeedback.quotation_id == 1,
        RecommendationFeedback.action == "DISMISSED"
    ).first()
    assert fb is not None

def test_upgrade_quote_line_upsell(db):
    """
    Upgrading a quotation line replaces lower-tier product with higher-tier product,
    preserves quantity, and updates price, discount, and margins.
    """
    lp16 = db.query(Product).filter(Product.name == "Laptop Pro 16").first()
    quote = db.query(Quotation).filter(Quotation.quote_number == "Q-1042").first()
    orig_total = quote.total_amount

    res = client.post("/api/quotes/Q-1042/upgrade", json={
        "target_product_id": lp16.id
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["new_product"] == "Laptop Pro 16"
    assert data["total_amount"] > orig_total

