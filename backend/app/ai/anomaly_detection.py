# ============================================================
# DealFlow360 - Deal Health & Anomaly Detection (ML)
# ============================================================
# detect_stalled_deals() -> list[DealHealthAlert]
# detect_unusual_discounts(quotation) -> list[AnomalyAlert]
# detect_delivery_slippage(fulfillment) -> list[SlippageAlert]
#
# Runs on a schedule (Celery task or cron)
# Results feed the Manager Deal Health Dashboard
# ============================================================
