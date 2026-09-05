from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from app.core.database import Base

class DealHealthSnapshot(Base):
    __tablename__ = "deal_health_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False, index=True)
    snapshot_date = Column(DateTime, nullable=False)
    health_score = Column(Float, nullable=False)
    margin_score = Column(Float, nullable=False)
    discount_risk_score = Column(Float, nullable=False)
    customer_engagement_score = Column(Float, nullable=False)
    fulfillment_score = Column(Float, nullable=False)
    payment_score = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    revenue_score = Column(Float, nullable=False)
    risk_level = Column(String(50), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    top_risk = Column(String(255), nullable=True)
    recommended_action = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class DealAnomaly(Base):
    __tablename__ = "deal_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False, index=True)
    anomaly_type = Column(String(50), nullable=False)  # HIGH_DISCOUNT, MARGIN_DROP, UNUSUAL_DISCOUNT_PATTERN, CUSTOMER_NEGOTIATION, FULFILLMENT_DELAY, LOW_STOCK, PAYMENT_DELAY, REVENUE_DROP
    severity = Column(String(50), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    detected_at = Column(DateTime, nullable=False)
    description = Column(String(500), nullable=False)
    expected_value = Column(Float, nullable=True)
    actual_value = Column(Float, nullable=True)
    impact_amount = Column(Float, nullable=True)
    status = Column(String(50), nullable=False, default="OPEN")  # OPEN, ACKNOWLEDGED, RESOLVED, IGNORED
    resolved_at = Column(DateTime, nullable=True)
    resolution_note = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
