# ============================================================
# DealFlow360 — Product ORM Model
# ============================================================
# Table: products
#   id, name, category, base_price, unit, tax_rate, description
#   is_recurring, billing_period (monthly|quarterly|yearly)
#   cost_price (for margin calculation)
#   created_at, updated_at
#
# Table: product_variants
#   id, product_id (FK), attribute_name, attribute_value, price_delta
#
# Table: pricelists
#   id, name, currency, tier, rules (JSON)
# ============================================================
