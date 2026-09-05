# ============================================================
# DealFlow360 - Approval Routing Service (DETERMINISTIC)
# ============================================================
# IMPORTANT: Pure business logic. No LLM.
#
# route_approval(quotation, risk_result) -> ApprovalPlan
#   Determines who needs to approve based on risk level + config
#
# approve_quotation(approval_request, approver) -> Quotation
# reject_quotation(approval_request, approver, reason) -> Quotation
# return_for_revision(approval_request, approver, reason) -> Quotation
#
# re_evaluate_after_negotiation(quotation) -> RiskResult
#   Called when customer submits a counter-offer
# ============================================================
