# ============================================================
# DealFlow360 — Quotation ORM Model (central object)
# ============================================================
# Table: quotations
#   id, reference, customer_id (FK), created_by (FK users)
#   status: draft|pending_approval|approved|rejected|sent|
#           negotiating|confirmed|fulfilled|cancelled
#   order_discount_pct, notes
#   risk_score, risk_level (low|medium|high)
#   version, parent_id (FK self - for version chain)
#   created_at, updated_at, expires_at
#
# Table: quotation_lines
#   id, quotation_id (FK), product_id (FK)
#   quantity, unit_price, discount_pct
#   line_total, margin_pct
#   is_recurring, billing_period
#   discount_violation (bool), violation_ceiling (decimal)
#
# Table: quotation_negotiations
#   id, quotation_id (FK), customer_id (FK)
#   type: comment|counter_offer|change_request|confirm
#   content, counter_discount_pct, line_id (nullable FK)
#   created_at
# ============================================================
