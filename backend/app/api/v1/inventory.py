# ============================================================
# DealFlow360 - Inventory & Warehouse Router
# ============================================================
# Endpoints:
#   GET    /warehouses            List warehouses
#   GET    /inventory             Stock levels by product/warehouse
#   POST   /fulfillment/plan      Calculate fulfillment split for order
#   PATCH  /fulfillment/{id}      Override fulfillment allocation (Ops)
#   GET    /fulfillment/{id}/backorders  Backorder status
# ============================================================
