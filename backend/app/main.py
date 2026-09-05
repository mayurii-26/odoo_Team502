# ============================================================
# DealFlow360 - FastAPI Application Entry Point
# ============================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import quotations, workspace, auth, admin, users
from app.services.currency_normalizer import router as currency_router

app = FastAPI(
    title="DealFlow360 API",
    description="Intelligent B2B Sales Operations Platform",
    version="0.1.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth & Verification"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users & Provisioning"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(quotations.router, prefix="/api/quotes", tags=["Quotations & Recommendations"])
app.include_router(quotations.router, prefix="/api/v1/quotations", tags=["Quotations (v1)"])
app.include_router(workspace.router, prefix="/api/v1/workspace", tags=["Workspace (v1)"])
app.include_router(workspace.router, prefix="/api/workspace", tags=["Workspace"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin (v1)"])
app.include_router(currency_router, prefix="/api/v1", tags=["Currency Normalizer (v1)"])
app.include_router(currency_router, prefix="/api", tags=["Currency Normalizer"])

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "DealFlow360 API"}
