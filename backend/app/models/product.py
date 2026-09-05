from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    parent_category_id = Column(Integer, ForeignKey("product_categories.id"), nullable=True)
    status = Column(String(50), nullable=False, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    category_id = Column(Integer, ForeignKey("product_categories.id"), nullable=False)
    product_family = Column(String(100), nullable=False)
    product_type = Column(String(50), nullable=False)  # PHYSICAL, SERVICE, SUBSCRIPTION
    tier = Column(Integer, nullable=True)  # 1, 2, 3
    parent_product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    unit_price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    margin_amount = Column(Float, nullable=False)
    margin_percent = Column(Float, nullable=False)
    is_subscription = Column(Boolean, default=False, nullable=False)
    subscription_plan_id = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_sellable = Column(Boolean, default=True, nullable=False)
    is_service = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    category = relationship("ProductCategory", back_populates="products")


class Pricelist(Base):
    __tablename__ = "pricelists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    currency = Column(String(10), nullable=False, default="USD")
    customer_tier = Column(String(50), nullable=True)
    discount_percent = Column(Float, nullable=False, default=0.0)
    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=False, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Promotion(Base):
    __tablename__ = "promotions"

    id = Column(Integer, primary_key=True, index=True)
    promotion_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    promotion_type = Column(String(50), nullable=False)  # PERCENTAGE, FIXED_AMOUNT, BUNDLE, UPGRADE, CATEGORY
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("product_categories.id"), nullable=True)
    discount_percent = Column(Float, nullable=True, default=0.0)
    discount_amount = Column(Float, nullable=True, default=0.0)
    minimum_quantity = Column(Integer, nullable=False, default=1)
    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime, nullable=True)
    priority = Column(Integer, nullable=False, default=1)
    status = Column(String(50), nullable=False, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ProductRelationship(Base):
    __tablename__ = "product_relationships"

    id = Column(Integer, primary_key=True, index=True)
    source_product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    target_product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    relationship_type = Column(String(50), nullable=False)  # UPSELL, CROSS_SELL
    strength = Column(Float, nullable=False, default=0.5)
    priority = Column(Integer, nullable=False, default=1)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
