# ============================================================
# DealFlow360 - LLM Assistant (natural language layer only)
# ============================================================
# IMPORTANT: LLM does NOT make business decisions.
#            It only generates human-readable explanations.
#
# explain_approval_reason(quotation, violations) -> str
#   e.g. 'This quotation requires Sales Manager approval because
#          the service line discount (18%) exceeds the Gold tier
#          ceiling of 10% by 8 percentage points.'
#
# explain_risk_score(quotation, risk_result) -> str
# summarize_quotation(quotation) -> str
# answer_policy_question(question, context) -> str  [RAG - optional]
# suggest_sales_response(negotiation) -> str
#
# Provider: configured via OPENAI_API_KEY / GEMINI_API_KEY in .env
# ============================================================
