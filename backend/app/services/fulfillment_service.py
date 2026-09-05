# ============================================================
# DealFlow360 - Warehouse Fulfillment Service (DETERMINISTIC)
# ============================================================
# IMPORTANT: Pure business logic. No LLM.
#
# plan_fulfillment(order) -> FulfillmentPlan
#   - Check stock across warehouses
#   - Recommend optimal allocation (minimise shipments / cost)
#   - Flag backorder lines
#
# override_fulfillment(plan, overrides) -> FulfillmentPlan
#   Ops team manual override
#
# handle_backorder(line) -> BackorderRecord
# ============================================================
