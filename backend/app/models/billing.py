from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    subscription_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    plan_name = Column(String(100), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    billing_frequency = Column(String(50), nullable=False, default="MONTHLY")  # MONTHLY, QUARTERLY, YEARLY
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    discount_percent = Column(Float, nullable=False, default=0.0)
    recurring_amount = Column(Float, nullable=False)
    status = Column(String(50), nullable=False, default="ACTIVE")  # TRIAL, ACTIVE, PAUSED, CANCELLED, EXPIRED
    next_billing_date = Column(DateTime, nullable=True)
    auto_renew = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    lines = relationship("SubscriptionLine", back_populates="subscription")


class SubscriptionLine(Base):
    __tablename__ = "subscription_lines"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    description = Column(String(255), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    discount_percent = Column(Float, nullable=False, default=0.0)
    line_total = Column(Float, nullable=False)
    billing_frequency = Column(String(50), nullable=False, default="MONTHLY")
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    subscription = relationship("Subscription", back_populates="lines")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    invoice_type = Column(String(50), nullable=False, default="CUSTOMER_INVOICE")  # CUSTOMER_INVOICE, SUBSCRIPTION_INVOICE, CREDIT_NOTE
    invoice_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    subtotal = Column(Float, nullable=False)
    discount_amount = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False)
    amount_paid = Column(Float, nullable=False, default=0.0)
    amount_due = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False, default="USD")
    status = Column(String(50), nullable=False, default="POSTED")  # DRAFT, POSTED, SENT, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED
    payment_status = Column(String(50), nullable=False, default="UNPAID")  # UNPAID, PARTIAL, PAID
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    lines = relationship("InvoiceLine", back_populates="invoice")
    payments = relationship("Payment", back_populates="invoice")


class InvoiceLine(Base):
    __tablename__ = "invoice_lines"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    description = Column(String(255), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    discount_percent = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    tax_percent = Column(Float, nullable=False, default=0.0)
    line_subtotal = Column(Float, nullable=False)
    line_total = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    invoice = relationship("Invoice", back_populates="lines")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_number = Column(String(50), unique=True, nullable=False, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    payment_date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False, default="USD")
    payment_method = Column(String(50), nullable=False)  # BANK_TRANSFER, CARD, UPI, CASH, OTHER
    transaction_reference = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="SUCCESS")  # PENDING, SUCCESS, FAILED, REFUNDED
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    invoice = relationship("Invoice", back_populates="payments")
