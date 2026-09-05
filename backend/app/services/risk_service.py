# ============================================================
# DealFlow360 - Risk Score Service (DETERMINISTIC)
# ============================================================
# IMPORTANT: Pure business logic. No LLM.
#
# calculate_risk_score(quotation, violations) -> RiskResult
#
# Risk inputs (proposed - confirm before implementing):
#   - Number of discount violations
#   - Max overage % across lines
#   - Margin % of overall quotation
#   - Customer tier
#   - Deal size vs. historical average
#   - Order-level discount applied
#
# Risk levels:
#   0-30  -> Low    (no approval needed)
#   31-60 -> Medium (Sales Manager approval)
#   61+   -> High   (Sales Manager + Finance approval)
# ============================================================
