# ============================================================
# DealFlow360 — Subscription & Billing ORM Model
# ============================================================
# Table: billing_schedules
#   id, quotation_id (FK), status: active|paused|cancelled
#   billing_period, next_billing_date, created_at
#
# Table: billing_schedule_lines
#   id, schedule_id (FK), product_id (FK)
#   quantity, unit_price, discount_pct, line_total
#
# Table: credit_notes
#   id, quotation_id (FK), reason, amount, issued_at
# ============================================================
