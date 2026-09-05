# ============================================================
# DealFlow360 — Notification Service
# ============================================================
import os
import secrets
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from app.utils.email import send_email, build_verification_email_html

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# In-memory token store for verification tokens (token -> {email, expires_at, full_name, user_id})
# In production or across restarts, also verified by database user status
VERIFICATION_TOKENS: Dict[str, Dict[str, Any]] = {}

def create_verification_token(email: str, full_name: str = "", user_id: Optional[int] = None) -> str:
    """
    Generates a secure verification token and stores it with a 24-hour expiration.
    """
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    VERIFICATION_TOKENS[token] = {
        "email": email.strip().lower(),
        "full_name": full_name,
        "user_id": user_id,
        "expires_at": expires_at,
    }
    return token

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Validates a verification token. Returns record if valid, otherwise None.
    """
    record = VERIFICATION_TOKENS.get(token)
    if not record:
        return None
    if datetime.utcnow() > record["expires_at"]:
        VERIFICATION_TOKENS.pop(token, None)
        return None
    return record

def consume_verification_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Consumes and removes a verification token once verified.
    """
    record = verify_token(token)
    if record:
        VERIFICATION_TOKENS.pop(token, None)
    return record

def send_customer_verification(email: str, full_name: str, user_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Generates token, builds link, and sends the verification email.
    """
    token = create_verification_token(email, full_name, user_id)
    base_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    verification_url = f"{base_url}?verify_token={token}&email={email}"
    
    subject = "Verify your DealFlow360 Account"
    html_content = build_verification_email_html(full_name=full_name, verification_url=verification_url, token=token)
    
    result = send_email(to=email, subject=subject, html=html_content)
    result["token"] = token
    result["verification_url"] = verification_url
    return result
