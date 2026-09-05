from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    quote_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    sales_rep_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    price_list_id = Column(Integer, ForeignKey("pricelists.id"), nullable=True)
    quote_date = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    status = Column(String(50), nullable=False, default="DRAFT")
    currency = Column(String(10), nullable=False, default="USD")
    subtotal = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    total_cost = Column(Float, nullable=False, default=0.0)
    gross_margin = Column(Float, nullable=False, default=0.0)
    margin_percent = Column(Float, nullable=False, default=0.0)
    discount_percent = Column(Float, nullable=False, default=0.0)
    approval_required = Column(Boolean, default=False, nullable=False)
    approval_status = Column(String(50), nullable=True)  # PENDING, APPROVED, REJECTED
    deal_health_score = Column(Float, nullable=False, default=80.0)
    customer_notes = Column(String(500), nullable=True)
    internal_notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    lines = relationship("QuotationLine", back_populates="quotation")


class QuotationLine(Base):
    __tablename__ = "quotation_lines"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    discount_percent = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    line_subtotal = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False)
    line_cost = Column(Float, nullable=False)
    line_margin = Column(Float, nullable=False)
    line_margin_percent = Column(Float, nullable=False)
    discount_limit_percent = Column(Float, nullable=False, default=15.0)
    discount_status = Column(String(50), nullable=False, default="OK")  # OK, OVER_LIMIT, PENDING_APPROVAL, APPROVED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    quotation = relationship("Quotation", back_populates="lines")


class HistoricalOrder(Base):
    __tablename__ = "historical_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    sales_rep_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_date = Column(DateTime, nullable=False)
    status = Column(String(50), nullable=False, default="COMPLETED")
    currency = Column(String(10), nullable=False, default="USD")
    subtotal = Column(Float, nullable=False)
    discount_amount = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False)
    payment_status = Column(String(50), nullable=False, default="PAID")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    lines = relationship("HistoricalOrderLine", back_populates="order")


class HistoricalOrderLine(Base):
    __tablename__ = "historical_order_lines"

    id = Column(Integer, primary_key=True, index=True)
    historical_order_id = Column(Integer, ForeignKey("historical_orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    discount_percent = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    unit_cost = Column(Float, nullable=False)
    line_revenue = Column(Float, nullable=False)
    line_cost = Column(Float, nullable=False)
    line_margin = Column(Float, nullable=False)
    line_margin_percent = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    order = relationship("HistoricalOrder", back_populates="lines")


class RecommendationFeedback(Base):
    __tablename__ = "recommendation_feedback"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recommendation_type = Column(String(50), nullable=False)  # UPSELL, CROSS_SELL
    action = Column(String(50), nullable=False)  # ADDED, DISMISSED
    reason = Column(String(100), nullable=True)  # NOT_RELEVANT, TOO_EXPENSIVE, ALREADY_OWNS, CUSTOMER_DECLINED, etc.
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
