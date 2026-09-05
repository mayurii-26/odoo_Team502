# ============================================================
# DealFlow360 - Admin Router & Recommendation Weight Settings
# ============================================================
from datetime import datetime
from typing import Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.recommendation_config import RecommendationWeightConfig

router = APIRouter()

DEFAULT_WEIGHTS: Dict[str, Dict[str, float]] = {
    "upsell": {
        "upgrade_frequency": 35.0,
        "margin_opportunity": 25.0,
        "promotion": 20.0,
        "customer_affinity": 10.0,
        "stock_availability": 10.0,
    },
    "cross_sell": {
        "co_purchase_frequency": 35.0,
        "compatibility": 20.0,
        "promotion": 15.0,
        "margin_opportunity": 20.0,
        "stock_availability": 10.0,
    },
}

class UpsellWeights(BaseModel):
    upgrade_frequency: float
    margin_opportunity: float
    promotion: float
    customer_affinity: float
    stock_availability: float

class CrossSellWeights(BaseModel):
    co_purchase_frequency: float
    compatibility: float
    promotion: float
    margin_opportunity: float
    stock_availability: float

class RecommendationWeightsPayload(BaseModel):
    upsell: Dict[str, float]
    cross_sell: Dict[str, float]

_ACTIVE_WEIGHTS: Dict[str, Dict[str, float]] = {
    "upsell": dict(DEFAULT_WEIGHTS["upsell"]),
    "cross_sell": dict(DEFAULT_WEIGHTS["cross_sell"]),
}

@router.get("/recommendation-weights")
def get_recommendation_weights(db: Session = Depends(get_db)):
    """
    Get the active recommendation scoring weights from database.
    Falls back gracefully to active memory weights if database is not reachable.
    """
    global _ACTIVE_WEIGHTS

    try:
        configs = db.query(RecommendationWeightConfig).all()
        for cfg in configs:
            rtype = cfg.recommendation_type.lower()
            if rtype in _ACTIVE_WEIGHTS and cfg.metric_name in _ACTIVE_WEIGHTS[rtype]:
                val = float(cfg.weight)
                _ACTIVE_WEIGHTS[rtype][cfg.metric_name] = int(val) if val.is_integer() else val
    except Exception:
        pass

    return _ACTIVE_WEIGHTS

@router.put("/recommendation-weights")
def update_recommendation_weights(payload: RecommendationWeightsPayload, db: Session = Depends(get_db)):
    """
    Update recommendation scoring weights in PostgreSQL database.
    Validates that:
    1. Each individual weight is between 0 and 100.
    2. Upsell weights sum to exactly 100.
    3. Cross-sell weights sum to exactly 100.
    """
    upsell = payload.upsell
    cross_sell = payload.cross_sell

    # 1. Bounds check
    for group_name, group_data in [("upsell", upsell), ("cross_sell", cross_sell)]:
        for metric, val in group_data.items():
            if val < 0 or val > 100:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Recommendation weights must be between 0 and 100."
                )

    # 2. Sum check
    upsell_sum = sum(upsell.values())
    cross_sum = sum(cross_sell.values())

    if abs(upsell_sum - 100) > 0.001 or abs(cross_sum - 100) > 0.001:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recommendation weights must total 100%."
        )

    # 3. Update active memory weights & persist to DB
    global _ACTIVE_WEIGHTS
    _ACTIVE_WEIGHTS["upsell"].update(upsell)
    _ACTIVE_WEIGHTS["cross_sell"].update(cross_sell)

    try:
        now = datetime.utcnow()
        for metric, val in upsell.items():
            cfg = db.query(RecommendationWeightConfig).filter(
                RecommendationWeightConfig.recommendation_type == "UPSELL",
                RecommendationWeightConfig.metric_name == metric
            ).first()
            if cfg:
                cfg.weight = float(val)
                cfg.updated_at = now
            else:
                cfg = RecommendationWeightConfig(
                    recommendation_type="UPSELL",
                    metric_name=metric,
                    weight=float(val),
                    enabled=True,
                    min_sample_size=3
                )
                db.add(cfg)

        for metric, val in cross_sell.items():
            cfg = db.query(RecommendationWeightConfig).filter(
                RecommendationWeightConfig.recommendation_type == "CROSS_SELL",
                RecommendationWeightConfig.metric_name == metric
            ).first()
            if cfg:
                cfg.weight = float(val)
                cfg.updated_at = now
            else:
                cfg = RecommendationWeightConfig(
                    recommendation_type="CROSS_SELL",
                    metric_name=metric,
                    weight=float(val),
                    enabled=True,
                    min_sample_size=3
                )
                db.add(cfg)

        db.commit()
    except Exception:
        db.rollback()

    return {
        "status": "success",
        "weights": {
            "upsell": upsell,
            "cross_sell": cross_sell
        }
    }
