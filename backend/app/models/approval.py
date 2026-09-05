from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    approval_number = Column(String(50), unique=True, nullable=False, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False, index=True)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=False)
    approval_type = Column(String(50), nullable=False)  # DISCOUNT, MARGIN_RISK, DEAL_RISK, NEGOTIATION_CHANGE
    reason = Column(String(500), nullable=False)
    risk_score = Column(Float, nullable=False, default=50.0)
    status = Column(String(50), nullable=False, default="PENDING")  # PENDING, APPROVED, REJECTED, CANCELLED
    requested_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    decision_comment = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    steps = relationship("ApprovalStep", back_populates="approval")


class ApprovalStep(Base):
    __tablename__ = "approval_steps"

    id = Column(Integer, primary_key=True, index=True)
    approval_id = Column(Integer, ForeignKey("approvals.id"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approver_role = Column(String(50), nullable=False)
    threshold_type = Column(String(50), nullable=False)  # DISCOUNT_PERCENT, MARGIN_PERCENT, TOTAL_AMOUNT
    threshold_value = Column(Float, nullable=False)
    status = Column(String(50), nullable=False, default="PENDING")  # PENDING, APPROVED, REJECTED, SKIPPED
    actioned_at = Column(DateTime, nullable=True)
    comment = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    approval = relationship("Approval", back_populates="steps")
