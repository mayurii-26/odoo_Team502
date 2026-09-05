from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from app.core.database import Base

class DiscountTier(Base):
    __tablename__ = "discount_tiers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    min_discount = Column(Float, nullable=False)
    max_discount = Column(Float, nullable=False)
    approval_required = Column(Boolean, default=False, nullable=False)
    approval_level = Column(String(50), nullable=True)
    description = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class DiscountRule(Base):
    __tablename__ = "discount_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category_id = Column(Integer, ForeignKey("product_categories.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    customer_tier = Column(String(50), nullable=True)
    max_discount_percent = Column(Float, nullable=False)
    approval_required = Column(Boolean, default=False, nullable=False)
    approval_role = Column(String(50), nullable=True)
    risk_level = Column(String(50), nullable=False, default="LOW")
    rule_description = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
