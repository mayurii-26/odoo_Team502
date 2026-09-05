from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.core.database import Base

class RecommendationWeightConfig(Base):
    __tablename__ = "recommendation_weight_configs"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_type = Column(String(50), nullable=False)  # UPSELL, CROSS_SELL
    metric_name = Column(String(100), nullable=False)
    weight = Column(Float, nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    min_sample_size = Column(Integer, default=3, nullable=False)
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
