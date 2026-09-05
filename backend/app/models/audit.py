from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    entity_type = Column(String(50), nullable=False)  # quotation, approval, user, product, invoice, fulfillment, negotiation
    entity_id = Column(Integer, nullable=False)
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, APPROVE, REJECT, SUBMIT, ADD_PRODUCT, REMOVE_PRODUCT, DISCOUNT_CHANGE, NEGOTIATION, PAYMENT, FULFILLMENT, LOGIN
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=False, default="10.0.0.1")
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
