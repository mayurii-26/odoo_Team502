from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from app.core.database import Base

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=False, default="India")
    manager_name = Column(String(100), nullable=True)
    capacity = Column(Integer, nullable=False, default=10000)
    status = Column(String(50), nullable=False, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class InventoryStock(Base):
    __tablename__ = "inventory_stock"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity_on_hand = Column(Integer, nullable=False, default=0)
    quantity_reserved = Column(Integer, nullable=False, default=0)
    quantity_available = Column(Integer, nullable=False, default=0)
    reorder_level = Column(Integer, nullable=False, default=10)
    reorder_quantity = Column(Integer, nullable=False, default=50)
    unit_cost = Column(Float, nullable=False)
    stock_status = Column(String(50), nullable=False, default="IN_STOCK")  # IN_STOCK, LOW_STOCK, OUT_OF_STOCK
    last_restocked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class FulfillmentOrder(Base):
    __tablename__ = "fulfillment_orders"

    id = Column(Integer, primary_key=True, index=True)
    fulfillment_number = Column(String(50), unique=True, nullable=False, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status = Column(String(50), nullable=False, default="PENDING")  # PENDING, ALLOCATED, PARTIALLY_FULFILLED, SHIPPED, DELIVERED, BACKORDERED, CANCELLED
    warehouse_strategy = Column(String(50), nullable=False, default="SINGLE_WAREHOUSE")  # SINGLE_WAREHOUSE, MULTI_WAREHOUSE, BACKORDER
    shipping_address = Column(String(500), nullable=True)
    requested_date = Column(DateTime, nullable=False)
    promised_date = Column(DateTime, nullable=True)
    shipped_date = Column(DateTime, nullable=True)
    delivered_date = Column(DateTime, nullable=True)
    tracking_number = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class FulfillmentLine(Base):
    __tablename__ = "fulfillment_lines"

    id = Column(Integer, primary_key=True, index=True)
    fulfillment_order_id = Column(Integer, ForeignKey("fulfillment_orders.id"), nullable=False)
    quotation_line_id = Column(Integer, ForeignKey("quotation_lines.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    ordered_quantity = Column(Integer, nullable=False)
    allocated_quantity = Column(Integer, nullable=False)
    fulfilled_quantity = Column(Integer, nullable=False)
    backordered_quantity = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="PENDING")
    unit_price = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
