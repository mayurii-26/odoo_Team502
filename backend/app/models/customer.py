from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_code = Column(String(50), unique=True, nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    industry = Column(String(100), nullable=False)
    company_size = Column(String(50), nullable=False)
    country = Column(String(100), nullable=False, default="United States")
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    currency = Column(String(10), nullable=False, default="USD")
    customer_tier = Column(String(50), nullable=False)  # SMB, MID_MARKET, ENTERPRISE
    sales_owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    credit_limit = Column(Float, nullable=False, default=50000.0)
    payment_terms_days = Column(Integer, nullable=False, default=30)
    lifetime_value = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    contacts = relationship("CustomerContact", back_populates="customer")


class CustomerContact(Base):
    __tablename__ = "customer_contacts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    job_title = Column(String(100), nullable=False)
    department = Column(String(100), nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    portal_enabled = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), nullable=False, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer = relationship("Customer", back_populates="contacts")
