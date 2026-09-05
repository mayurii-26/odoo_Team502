# ============================================================
# DealFlow360 - Customer Portal Router (Customer role ONLY)
# ============================================================
# Endpoints:
#   GET    /portal/quotations         My quotations (customer view)
#   GET    /portal/quotations/{id}    Quotation detail (restricted fields)
#   POST   /portal/quotations/{id}/comment      Add comment
#   POST   /portal/quotations/{id}/counter      Submit counter-offer
#   POST   /portal/quotations/{id}/confirm      Confirm quotation
# Note: All endpoints enforce Customer role. No internal data exposed.
# ============================================================
