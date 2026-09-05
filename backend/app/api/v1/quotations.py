# ============================================================
# DealFlow360 — Quotations Router (core module)
# ============================================================
# Endpoints:
#   GET    /quotations            List quotations (filtered by role)
#   POST   /quotations            Create new quotation (Sales Rep)
#   GET    /quotations/{id}       Quotation detail with all sub-data
#   PATCH  /quotations/{id}       Update quotation lines/discounts
#   POST   /quotations/{id}/submit      Submit for approval
#   POST   /quotations/{id}/send-portal Send to customer portal
#   GET    /quotations/{id}/risk        Get risk score + violations
#   GET    /quotations/{id}/recommendations  AI upsell/cross-sell
#   GET    /quotations/{id}/audit        Audit trail for quotation
# ============================================================
