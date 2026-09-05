# ============================================================
# DealFlow360 - Discount Governance Service (DETERMINISTIC)
# ============================================================
# IMPORTANT: This is pure business logic. No LLM involvement.
#
# check_line_discount(product, customer_tier, discount_pct)
#   -> DiscountCheckResult(allowed, ceiling, violation, overage_pct)
#
# check_quotation_discounts(quotation)
#   -> list[LineViolation]
#
# CEILING RULES (configured by Admin):
#   Gold / Hardware    -> max 15%
#   Gold / Service     -> max 10%
#   Silver / Hardware  -> max 20%
#   etc. (loaded from discount_configs table)
# ============================================================
