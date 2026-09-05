# ============================================================
# DealFlow360 — Approval Workflow ORM Model
# ============================================================
# Table: approval_requests
#   id, quotation_id (FK), level (1=manager, 2=finance)
#   status: pending|approved|rejected|returned
#   approver_id (FK users), assigned_at
#   actioned_at, reason, created_at
#
# Table: approval_chain_configs
#   id, name, risk_threshold_low, risk_threshold_high
#   level1_role, level2_role (nullable)
#   created_by (FK), created_at
# ============================================================
