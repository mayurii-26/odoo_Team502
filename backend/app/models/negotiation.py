from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Negotiation(Base):
    __tablename__ = "negotiations"

    id = Column(Integer, primary_key=True, index=True)
    negotiation_number = Column(String(50), unique=True, nullable=False, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    initiated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    current_discount_percent = Column(Float, nullable=False)
    requested_discount_percent = Column(Float, nullable=False)
    current_total = Column(Float, nullable=False)
    requested_total = Column(Float, nullable=False)
    customer_message = Column(String(500), nullable=True)
    sales_response = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, default="OPEN")  # OPEN, COUNTERED, ACCEPTED, REJECTED, EXPIRED
    risk_score = Column(Float, nullable=False, default=50.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    messages = relationship("NegotiationMessage", back_populates="negotiation")


class NegotiationMessage(Base):
    __tablename__ = "negotiation_messages"

    id = Column(Integer, primary_key=True, index=True)
    negotiation_id = Column(Integer, ForeignKey("negotiations.id"), nullable=False, index=True)
    sender_type = Column(String(50), nullable=False)  # CUSTOMER, SALES_REP, MANAGER, SYSTEM
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    message = Column(String(1000), nullable=False)
    requested_discount_percent = Column(Float, nullable=True)
    proposed_discount_percent = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    negotiation = relationship("Negotiation", back_populates="messages")
