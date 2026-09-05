# ============================================================
# DealFlow360 — Upsell / Cross-sell Recommendation Engine (ML)
# ============================================================
# get_recommendations(quotation) -> list[Recommendation]
#
# Approach (v1 — decide before implementing):
#   Option A: Rule-based (product bundles, category relationships)
#   Option B: Co-purchase frequency matrix from order history
#   Option C: Hybrid (rules + lightweight collaborative filtering)
#
# Each recommendation includes:
#   product, reason, margin_delta, is_promoted
#
# Uses pgvector if embedding-based similarity is implemented
# ============================================================
