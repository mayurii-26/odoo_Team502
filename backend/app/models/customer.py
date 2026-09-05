# ============================================================
# DealFlow360 — Customer ORM Model
# ============================================================
# Table: customers
# Fields:
#   id, name, company_name, email, phone, address
#   tier (bronze | silver | gold | platinum)
#   user_id (FK to users - the portal user account if exists)
#   created_at, updated_at
#
# Relationships:
#   quotations -> Quotation
#   discount_rules -> CustomerDiscountRule
# ============================================================
