# ============================================================
# DealFlow360 — FastAPI Application Entry Point
# ============================================================
# Responsibilities:
#   - Create and configure the FastAPI app instance
#   - Register all API routers (v1)
#   - Configure CORS for the React frontend
#   - Add global middleware (logging, request ID, etc.)
#   - Health check endpoint
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# TODO: import routers when implemented
# from app.api.v1 import auth, users, customers, products
# from app.api.v1 import quotations, approvals, inventory, billing, reports

app = FastAPI(
    title="DealFlow360 API",
    description="Intelligent B2B Sales Operations Platform",
    version="0.1.0",
)

# CORS — allow the React frontend (localhost:5173 in dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # TODO: configure from env in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TODO: register routers
# app.include_router(auth.router,       prefix="/api/v1/auth",       tags=["Auth"])
# app.include_router(users.router,      prefix="/api/v1/users",      tags=["Users"])
# app.include_router(customers.router,  prefix="/api/v1/customers",  tags=["Customers"])
# app.include_router(products.router,   prefix="/api/v1/products",   tags=["Products"])
# app.include_router(quotations.router, prefix="/api/v1/quotations", tags=["Quotations"])
# app.include_router(approvals.router,  prefix="/api/v1/approvals",  tags=["Approvals"])
# app.include_router(inventory.router,  prefix="/api/v1/inventory",  tags=["Inventory"])
# app.include_router(billing.router,    prefix="/api/v1/billing",    tags=["Billing"])
# app.include_router(reports.router,    prefix="/api/v1/reports",    tags=["Reports"])


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "DealFlow360 API"}
