# ============================================================
# DealFlow360 - Quotations Router & Recommendation Endpoints
# ============================================================
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Quotation, QuotationLine, Product, RecommendationFeedback, Promotion
from app.ai.recommendations import RecommendationEngine

router = APIRouter()

class FeedbackRequest(BaseModel):
    product_id: int
    customer_id: int
    user_id: int
    recommendation_type: str  # UPSELL or CROSS_SELL
    action: str  # ADDED or DISMISSED
    reason: Optional[str] = None

class AddLineRequest(BaseModel):
    product_id: int
    quantity: int = 1
    discount_percent: float = 0.0

class UpgradeRequest(BaseModel):
    source_line_id: int
    target_product_id: int

@router.get("/{quote_id}/recommendations")
def get_quote_recommendations(quote_id: str, db: Session = Depends(get_db)):
    """
    Returns AI/Data-driven upsell and cross-sell recommendations for a quotation.
    Supports either integer quote_id or quote_number string (e.g. Q-1042).
    """
    quote = None
    if quote_id.isdigit():
        quote = db.query(Quotation).filter(Quotation.id == int(quote_id)).first()
    if not quote:
        quote = db.query(Quotation).filter(Quotation.quote_number == quote_id).first()

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quotation with ID or number '{quote_id}' not found."
        )

    engine = RecommendationEngine(db)
    return engine.get_recommendations(quote.id)

@router.post("/{quote_id}/recommendations/feedback")
def record_recommendation_feedback(quote_id: str, payload: FeedbackRequest, db: Session = Depends(get_db)):
    """
    Record user feedback on recommendations (e.g., dismiss or accept).
    """
    quote = None
    if quote_id.isdigit():
        quote = db.query(Quotation).filter(Quotation.id == int(quote_id)).first()
    if not quote:
        quote = db.query(Quotation).filter(Quotation.quote_number == quote_id).first()

    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found.")

    feedback = RecommendationFeedback(
        quotation_id=quote.id,
        customer_id=payload.customer_id,
        product_id=payload.product_id,
        user_id=payload.user_id,
        recommendation_type=payload.recommendation_type,
        action=payload.action,
        reason=payload.reason
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return {"status": "success", "feedback_id": feedback.id}

@router.post("/{quote_id}/lines")
def add_quote_line(quote_id: str, payload: AddLineRequest, db: Session = Depends(get_db)):
    """
    Add a recommended cross-sell product to the quotation and recalculate totals.
    """
    quote = None
    if quote_id.isdigit():
        quote = db.query(Quotation).filter(Quotation.id == int(quote_id)).first()
    if not quote:
        quote = db.query(Quotation).filter(Quotation.quote_number == quote_id).first()

    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found.")

    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    # Check for active promotion discount
    promo = db.query(Promotion).filter(
        Promotion.product_id == product.id,
        Promotion.status == "ACTIVE"
    ).first()

    disc_pct = payload.discount_percent
    if disc_pct == 0.0 and promo and promo.discount_percent:
        disc_pct = promo.discount_percent

    disc_amt = round(payload.quantity * product.unit_price * (disc_pct / 100.0), 2)
    l_sub = round(payload.quantity * product.unit_price - disc_amt, 2)
    l_cost = round(payload.quantity * product.cost_price, 2)
    l_margin = round(l_sub - l_cost, 2)
    l_margin_pct = round((l_margin / l_sub) * 100, 2) if l_sub > 0 else 0.0

    new_line = QuotationLine(
        quotation_id=quote.id,
        product_id=product.id,
        quantity=payload.quantity,
        unit_price=product.unit_price,
        discount_percent=disc_pct,
        discount_amount=disc_amt,
        line_subtotal=l_sub,
        unit_cost=product.cost_price,
        line_cost=l_cost,
        line_margin=l_margin,
        line_margin_percent=l_margin_pct,
        discount_limit_percent=15.0,
        discount_status="OK" if disc_pct <= 15.0 else "OVER_LIMIT"
    )
    db.add(new_line)
    db.flush()

    # Recalculate quotation totals
    lines = db.query(QuotationLine).filter(QuotationLine.quotation_id == quote.id).all()
    q_sub = sum(l.quantity * l.unit_price for l in lines)
    q_disc = sum(l.discount_amount for l in lines)
    q_cost = sum(l.line_cost for l in lines)
    tax = round((q_sub - q_disc) * 0.08, 2)
    tot = round((q_sub - q_disc) + tax, 2)
    gross_margin = round((q_sub - q_disc) - q_cost, 2)
    net_rev = q_sub - q_disc
    m_pct = round((gross_margin / net_rev) * 100, 2) if net_rev > 0 else 0.0

    quote.subtotal = round(q_sub, 2)
    quote.discount_amount = round(q_disc, 2)
    quote.tax_amount = tax
    quote.total_amount = tot
    quote.total_cost = round(q_cost, 2)
    quote.gross_margin = gross_margin
    quote.margin_percent = m_pct
    quote.discount_percent = round((q_disc / q_sub) * 100, 2) if q_sub > 0 else 0.0

    db.commit()
    return {
        "status": "success",
        "quotation_id": quote.id,
        "quote_number": quote.quote_number,
        "subtotal": quote.subtotal,
        "discount_amount": quote.discount_amount,
        "total_amount": quote.total_amount,
        "gross_margin": quote.gross_margin,
        "margin_percent": quote.margin_percent
    }

@router.post("/{quote_id}/upgrade")
def upgrade_quote_line(quote_id: str, payload: UpgradeRequest, db: Session = Depends(get_db)):
    """
    Upgrade a quotation line to a higher-tier product while preserving quantity.
    """
    quote = None
    if quote_id.isdigit():
        quote = db.query(Quotation).filter(Quotation.id == int(quote_id)).first()
    if not quote:
        quote = db.query(Quotation).filter(Quotation.quote_number == quote_id).first()

    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found.")

    line = db.query(QuotationLine).filter(
        QuotationLine.id == payload.source_line_id,
        QuotationLine.quotation_id == quote.id
    ).first()
    if not line:
        raise HTTPException(status_code=404, detail="Quotation line not found.")

    target_prod = db.query(Product).filter(Product.id == payload.target_product_id).first()
    if not target_prod:
        raise HTTPException(status_code=404, detail="Target product not found.")

    # Check for upgrade promotion
    promo = db.query(Promotion).filter(
        Promotion.product_id == target_prod.id,
        Promotion.status == "ACTIVE"
    ).first()
    disc_pct = promo.discount_percent if promo and promo.discount_percent else line.discount_percent

    disc_amt = round(line.quantity * target_prod.unit_price * (disc_pct / 100.0), 2)
    l_sub = round(line.quantity * target_prod.unit_price - disc_amt, 2)
    l_cost = round(line.quantity * target_prod.cost_price, 2)
    l_margin = round(l_sub - l_cost, 2)
    l_margin_pct = round((l_margin / l_sub) * 100, 2) if l_sub > 0 else 0.0

    line.product_id = target_prod.id
    line.unit_price = target_prod.unit_price
    line.discount_percent = disc_pct
    line.discount_amount = disc_amt
    line.line_subtotal = l_sub
    line.unit_cost = target_prod.cost_price
    line.line_cost = l_cost
    line.line_margin = l_margin
    line.line_margin_percent = l_margin_pct

    db.flush()

    # Recalculate quotation
    lines = db.query(QuotationLine).filter(QuotationLine.quotation_id == quote.id).all()
    q_sub = sum(l.quantity * l.unit_price for l in lines)
    q_disc = sum(l.discount_amount for l in lines)
    q_cost = sum(l.line_cost for l in lines)
    tax = round((q_sub - q_disc) * 0.08, 2)
    tot = round((q_sub - q_disc) + tax, 2)
    gross_margin = round((q_sub - q_disc) - q_cost, 2)
    net_rev = q_sub - q_disc
    m_pct = round((gross_margin / net_rev) * 100, 2) if net_rev > 0 else 0.0

    quote.subtotal = round(q_sub, 2)
    quote.discount_amount = round(q_disc, 2)
    quote.tax_amount = tax
    quote.total_amount = tot
    quote.total_cost = round(q_cost, 2)
    quote.gross_margin = gross_margin
    quote.margin_percent = m_pct
    quote.discount_percent = round((q_disc / q_sub) * 100, 2) if q_sub > 0 else 0.0

    db.commit()
    return {
        "status": "success",
        "upgraded_line_id": line.id,
        "new_product": target_prod.name,
        "subtotal": quote.subtotal,
        "discount_amount": quote.discount_amount,
        "total_amount": quote.total_amount,
        "gross_margin": quote.gross_margin,
        "margin_percent": quote.margin_percent
    }
