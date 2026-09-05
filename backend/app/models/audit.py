# ============================================================
# DealFlow360 — Audit Trail ORM Model
# ============================================================
# Table: audit_logs
#   id, entity_type (quotation|approval|user|product|...)
#   entity_id, action (created|updated|submitted|approved|...)
#   actor_id (FK users), actor_role
#   old_value (JSON), new_value (JSON)
#   reason (optional), ip_address
#   created_at
#
# This table is append-only. No updates or deletes.
# ============================================================
