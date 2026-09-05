# ============================================================
# DealFlow360 — Subscription & Billing Service (DETERMINISTIC)
# ============================================================
# IMPORTANT: Pure business logic. No LLM.
#
# create_billing_schedule(order) -> BillingSchedule
#   Splits order lines into one-time and recurring
#
# calculate_proration(subscription, change_date) -> Decimal
#   Pro-rata amount for mid-period changes
#
# cancel_subscription(subscription, reason) -> CreditNoteData
# issue_credit_note(data) -> CreditNote
# ============================================================
