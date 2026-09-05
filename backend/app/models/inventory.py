# ============================================================
# DealFlow360 — Inventory & Warehouse ORM Model
# ============================================================
# Table: warehouses
#   id, name, location, is_active
#
# Table: stock
#   id, warehouse_id (FK), product_id (FK)
#   quantity_on_hand, quantity_reserved, quantity_available
#   updated_at
#
# Table: fulfillment_plans
#   id, quotation_id (FK), status: planned|partial|complete
#   created_at, updated_at
#
# Table: fulfillment_lines
#   id, plan_id (FK), quotation_line_id (FK)
#   warehouse_id (FK), quantity, is_backorder
# ============================================================
