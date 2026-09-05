import os
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import engine
from app.models import Base
from app.api.v1 import quotations, workspace, auth, admin, users, chat
from app.services.currency_normalizer import router as currency_router
from app.services.chat_socket import sio

# Auto-ensure database schema exists on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DealFlow360 API",
    description="Intelligent B2B Sales Operations Platform",
    version="0.1.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads static directory for image/document access
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(os.path.join(UPLOAD_DIR, "chat"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Mount Socket.IO real-time engine
sio_app = socketio.ASGIApp(socketio_server=sio, socketio_path="")
app.mount("/socket.io", sio_app)

# Register routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth & Verification"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users & Provisioning"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat & Messaging (v1)"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat & Messaging"])
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
    return {"status": "ok", "service": "DealFlow360 API", "realtime": "Socket.IO ready"}

