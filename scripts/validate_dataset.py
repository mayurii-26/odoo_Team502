"""
DealFlow360 - Complete Data Quality & Integrity Validation
Validates all 20 rules specified in Section 47.
"""

import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.core.database import SessionLocal
from app.models import (
    User, Customer, CustomerContact, ProductCategory, Product,
    Pricelist, Promotion, ProductRelationship, Warehouse, InventoryStock,
    DiscountTier, DiscountRule, Quotation, QuotationLine, HistoricalOrder,
    HistoricalOrderLine, RecommendationFeedback, Approval, ApprovalStep,
    FulfillmentOrder, FulfillmentLine, Subscription, SubscriptionLine,
    Invoice, InvoiceLine, Payment, Negotiation, NegotiationMessage,
    DealHealthSnapshot, DealAnomaly, AuditLog
)
from app.ai.recommendations import RecommendationEngine

def run_validations():
    session = SessionLocal()
    print("=" * 70)
    print("RUNNING DEALFLOW360 DATA QUALITY VALIDATIONS (20 CHECKS)")
    print("=" * 70)

    results = []

    def check(num: int, name: str, passed: bool, detail: str = ""):
        status_str = "PASS" if passed else "FAIL"
        results.append((num, name, passed, detail))
        print(f"[{status_str}] Check {num:02d}: {name}")
        if detail:
            print(f"         Detail: {detail}")

    # 1. Every foreign key exists
    fk_errors = 0
    # Customer sales_owner_id -> users
    user_ids = {u.id for u in session.query(User.id).all()}
    for c in session.query(Customer).all():
        if c.sales_owner_id not in user_ids:
            fk_errors += 1
    # CustomerContact customer_id -> customers
    customer_ids = {c.id for c in session.query(Customer.id).all()}
    for cc in session.query(CustomerContact).all():
        if cc.customer_id not in customer_ids:
            fk_errors += 1
    # Quotation customer_id -> customers, sales_rep_id -> users
    for q in session.query(Quotation).all():
        if q.customer_id not in customer_ids or q.sales_rep_id not in user_ids:
            fk_errors += 1
    quote_ids = {q.id for q in session.query(Quotation.id).all()}
    product_ids = {p.id for p in session.query(Product.id).all()}
    for ql in session.query(QuotationLine).all():
        if ql.quotation_id not in quote_ids or ql.product_id not in product_ids:
            fk_errors += 1
    check(1, "Every foreign key exists", fk_errors == 0, f"Total foreign key errors: {fk_errors}")

    # 2. No orphan records
    orphans = 0
    for ql in session.query(QuotationLine).all():
        if not session.query(Quotation).filter(Quotation.id == ql.quotation_id).first():
            orphans += 1
    for invl in session.query(InvoiceLine).all():
        if not session.query(Invoice).filter(Invoice.id == invl.invoice_id).first():
            orphans += 1
    for fl in session.query(FulfillmentLine).all():
        if not session.query(FulfillmentOrder).filter(FulfillmentOrder.id == fl.fulfillment_order_id).first():
            orphans += 1
    check(2, "No orphan records", orphans == 0, f"Total orphan records: {orphans}")

    # 3. Quote totals match quote lines
    quote_mismatches = 0
    for q in session.query(Quotation).all():
        lines = session.query(QuotationLine).filter(QuotationLine.quotation_id == q.id).all()
        expected_subtotal = round(sum(l.quantity * l.unit_price for l in lines), 2)
        expected_disc = round(sum(l.discount_amount for l in lines), 2)
        expected_cost = round(sum(l.line_cost for l in lines), 2)
        expected_margin = round((expected_subtotal - expected_disc) - expected_cost, 2)
        if abs(q.subtotal - expected_subtotal) > 0.05 or abs(q.discount_amount - expected_disc) > 0.05:
            quote_mismatches += 1
    check(3, "Quote totals match quote lines", quote_mismatches == 0, f"Quote calculation mismatches: {quote_mismatches}")

    # 4. Invoice totals match invoice lines
    inv_mismatches = 0
    for inv in session.query(Invoice).all():
        lines = session.query(InvoiceLine).filter(InvoiceLine.invoice_id == inv.id).all()
        exp_subtotal = round(sum(l.line_subtotal for l in lines), 2)
        exp_total = round(sum(l.line_total for l in lines), 2)
        if abs(inv.subtotal - exp_subtotal) > 0.05 or abs(inv.total_amount - exp_total) > 0.05:
            inv_mismatches += 1
    check(4, "Invoice totals match invoice lines", inv_mismatches == 0, f"Invoice line sum mismatches: {inv_mismatches}")

    # 5. Payment totals match invoice payment status
    pay_mismatches = 0
    for inv in session.query(Invoice).all():
        succ_payments = session.query(Payment).filter(Payment.invoice_id == inv.id, Payment.status == "SUCCESS").all()
        actual_paid = round(sum(p.amount for p in succ_payments), 2)
        if abs(inv.amount_paid - actual_paid) > 0.05:
            pay_mismatches += 1
    check(5, "Payment totals match invoice payment status", pay_mismatches == 0, f"Payment/invoice reconciliation mismatches: {pay_mismatches}")

    # 6. Inventory available = on hand - reserved
    inv_stock_errors = 0
    for st in session.query(InventoryStock).all():
        if st.quantity_available != (st.quantity_on_hand - st.quantity_reserved):
            inv_stock_errors += 1
    check(6, "Inventory available = on hand - reserved", inv_stock_errors == 0, f"Inventory arithmetic errors: {inv_stock_errors}")

    # 7. Fulfilled <= allocated <= ordered
    fulf_order_errors = 0
    for fl in session.query(FulfillmentLine).all():
        if not (fl.fulfilled_quantity <= fl.allocated_quantity <= fl.ordered_quantity):
            fulf_order_errors += 1
    check(7, "Fulfilled <= allocated <= ordered", fulf_order_errors == 0, f"Fulfillment quantity inequality errors: {fulf_order_errors}")

    # 8. Backordered = ordered - fulfilled
    backorder_errors = 0
    for fl in session.query(FulfillmentLine).all():
        if fl.backordered_quantity != (fl.ordered_quantity - fl.fulfilled_quantity):
            backorder_errors += 1
    check(8, "Backordered = ordered - fulfilled", backorder_errors == 0, f"Backorder calculation errors: {backorder_errors}")

    # 9. Margin calculations are correct
    margin_errors = 0
    for p in session.query(Product).all():
        expected_margin = round(p.unit_price - p.cost_price, 2)
        if abs(p.margin_amount - expected_margin) > 0.05:
            margin_errors += 1
    for ql in session.query(QuotationLine).all():
        exp_margin = round(ql.line_subtotal - ql.line_cost, 2)
        if abs(ql.line_margin - exp_margin) > 0.05:
            margin_errors += 1
    check(9, "Margin calculations are correct", margin_errors == 0, f"Margin arithmetic errors: {margin_errors}")

    # 10. Discount status agrees with discount rules
    rule_mismatches = 0
    over_limit_count = session.query(QuotationLine).filter(QuotationLine.discount_status == "OVER_LIMIT").count()
    for ql in session.query(QuotationLine).all():
        if ql.discount_percent > ql.discount_limit_percent and ql.discount_status != "OVER_LIMIT":
            rule_mismatches += 1
        elif ql.discount_percent <= ql.discount_limit_percent and ql.discount_status == "OVER_LIMIT":
            rule_mismatches += 1
    check(10, "Discount status agrees with discount rules", rule_mismatches == 0 and over_limit_count >= 10,
          f"Over limit count = {over_limit_count} (target >= 10), rule mismatches = {rule_mismatches}")

    # 11. Approval status agrees with approval records
    app_quote_ids = {a.quotation_id for a in session.query(Approval).all()}
    pending_quotes = session.query(Quotation).filter(Quotation.approval_required == True).all()
    app_status_match = all(pq.id in app_quote_ids for pq in pending_quotes)
    check(11, "Approval status agrees with approval records", app_status_match, f"Quotes requiring approval linked to approval requests: {app_status_match}")

    # 12. Subscription totals are correct
    sub_errors = 0
    for s in session.query(Subscription).all():
        slines = session.query(SubscriptionLine).filter(SubscriptionLine.subscription_id == s.id).all()
        exp_rec = round(sum(sl.line_total for sl in slines), 2)
        if abs(s.recurring_amount - exp_rec) > 0.05:
            sub_errors += 1
    check(12, "Subscription totals are correct", sub_errors == 0, f"Subscription line mismatches: {sub_errors}")

    # 13. Historical order totals match historical order lines
    ho_errors = 0
    for ho in session.query(HistoricalOrder).all():
        hlines = session.query(HistoricalOrderLine).filter(HistoricalOrderLine.historical_order_id == ho.id).all()
        exp_sub = round(sum(hl.quantity * hl.unit_price for hl in hlines), 2)
        exp_disc = round(sum(hl.discount_amount for hl in hlines), 2)
        if abs(ho.subtotal - exp_sub) > 0.05 or abs(ho.discount_amount - exp_disc) > 0.05:
            ho_errors += 1
    check(13, "Historical order totals match historical order lines", ho_errors == 0, f"Historical order line sum mismatches: {ho_errors}")

    # 14. Co-purchase calculations work
    engine = RecommendationEngine(session)
    q1 = session.query(Quotation).filter(Quotation.quote_number == "Q-1042").first()
    recs = engine.get_recommendations(q1.id)
    mouse_rec = next((r for r in recs["cross_sell"] if r["product_name"] == "Wireless Mouse"), None)
    dock_rec = next((r for r in recs["cross_sell"] if r["product_name"] == "Docking Station"), None)
    copurchase_ok = mouse_rec and dock_rec and mouse_rec["co_purchase_rate"] > 0.5 and dock_rec["co_purchase_rate"] > 0.3
    check(14, "Co-purchase calculations work", copurchase_ok,
          f"Wireless Mouse co-purchase = {mouse_rec['co_purchase_rate'] if mouse_rec else None}, Docking Station = {dock_rec['co_purchase_rate'] if dock_rec else None}")

    # 15. Upgrade rate calculations work
    lp16_rec = next((r for r in recs["upsell"] if r["product_name"] == "Laptop Pro 16"), None)
    lp18_rec = next((r for r in recs["upsell"] if r["product_name"] == "Laptop Pro 18"), None)
    upgrade_ok = lp16_rec and lp18_rec and (0.30 <= lp16_rec["upgrade_rate"] <= 0.40) and (0.10 <= lp18_rec["upgrade_rate"] <= 0.20)
    check(15, "Upgrade rate calculations work", bool(upgrade_ok),
          f"Laptop Pro 16 upgrade rate = {lp16_rec['upgrade_rate'] if lp16_rec else None}, Laptop Pro 18 = {lp18_rec['upgrade_rate'] if lp18_rec else None}")

    # 16. Q-1042 recommendations return at least 3 cross-sells
    cross_sell_count = len(recs["cross_sell"])
    check(16, "Q-1042 recommendations return at least 3 cross-sells", cross_sell_count >= 3, f"Returned {cross_sell_count} cross-sells")

    # 17. Q-1042 returns at least 1 valid upsell
    upsell_count = len(recs["upsell"])
    check(17, "Q-1042 returns at least 1 valid upsell", upsell_count >= 1, f"Returned {upsell_count} upsells")

    # 18. Out-of-stock products are not recommended
    # Product 24 is OUT OF STOCK (available = 0)
    p24_in_upsell = any(r["product_id"] == 24 for r in recs["upsell"])
    p24_in_cross = any(r["product_id"] == 24 for r in recs["cross_sell"])
    oos_omitted = not p24_in_upsell and not p24_in_cross
    check(18, "Out-of-stock products are not recommended", oos_omitted, f"Product 24 (Out of Stock) omitted: {oos_omitted}")

    # 19. Expired promotions are not treated as active
    now = datetime.utcnow()
    exp_promos = session.query(Promotion).filter(Promotion.status == "EXPIRED").all()
    exp_active = any(p.valid_to and p.valid_to >= now for p in exp_promos)
    check(19, "Expired promotions are not treated as active", not exp_active, f"No expired promotions treated as active: {not exp_active}")

    # 20. Active promotions appear in recommendation scoring
    has_promo_in_rec = any(r["promotion"] is not None for r in recs["upsell"] + recs["cross_sell"])
    check(20, "Active promotions appear in recommendation scoring", has_promo_in_rec, f"Active promotion present in recommendation scoring: {has_promo_in_rec}")

    session.close()

    total_passed = sum(1 for _, _, p, _ in results if p)
    print("=" * 70)
    print(f"VALIDATION SUMMARY: {total_passed} / {len(results)} CHECKS PASSED")
    print("=" * 70)
    return total_passed == len(results)

if __name__ == "__main__":
    success = run_validations()
    sys.exit(0 if success else 1)
