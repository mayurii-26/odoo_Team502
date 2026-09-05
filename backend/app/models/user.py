# ============================================================
# DealFlow360 — User ORM Model
# ============================================================
# Table: users
# Fields:
#   id, email, hashed_password, full_name, role, is_active
#   company_id (FK), team, created_at, updated_at, last_login
#
# Roles (enum): admin | sales_rep | sales_manager | finance | customer
#
# Invite fields:
#   invite_token, invite_expires_at, invite_accepted_at
#
# Relationships:
#   company -> Company
#   quotations -> Quotation (created_by)
#   approvals -> Approval (approver)
# ============================================================
