# ============================================================
# DealFlow360 - Audit Trail Utility
# ============================================================
# log_action(entity_type, entity_id, action, actor, old, new, reason)
#
# Called from services whenever a business-critical action occurs:
#   - Quotation created / updated / submitted / approved / rejected
#   - User role changed
#   - Discount config changed
#   - Fulfillment overridden
#   - Credit note issued
#
# Writes to audit_logs table (append-only).
# ============================================================
