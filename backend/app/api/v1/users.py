# ============================================================
# DealFlow360 - Users & Admin Provisioning Router
# ============================================================
import os
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.customer import Customer
from app.api.v1.auth import hash_password
from app.utils.email import send_email, build_provisioning_email_html, build_admin_message_email_html

logger = logging.getLogger("dealflow360.users")
router = APIRouter()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

class ProvisionUserRequest(BaseModel):
    name: str
    email: EmailStr
    role: str
    company_name: Optional[str] = "DealFlow360"
    password: Optional[str] = "password123"

class AdminDirectMessageRequest(BaseModel):
    recipient_name: str
    recipient_email: EmailStr
    subject: str
    message: str
    priority: Optional[str] = "Normal"
    sender_name: Optional[str] = "Root Administrator (Sarah Connor)"

class ChangeRoleRequest(BaseModel):
    role: str

@router.get("/")
def list_all_users(db: Session = Depends(get_db)):
    """
    Returns all users in the PostgreSQL database.
    """
    users = db.query(User).order_by(User.id.desc()).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "status": u.status,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
        }
        for u in users
    ]

@router.post("/provision")
def provision_user_and_send_email(payload: ProvisionUserRequest, db: Session = Depends(get_db)):
    """
    Admin endpoint to create/update user in PostgreSQL and dispatch credentials email via Resend.
    """
    clean_email = payload.email.strip().lower()
    clean_name = payload.name.strip()
    raw_password = payload.password or "password123"
    hashed_pwd = hash_password(raw_password)

    role_label_map = {
        "admin": "Administrator",
        "finance": "Financial Officer",
        "sales_manager": "Sales Manager",
        "sales_rep": "Sales Representative",
        "customer": "Customer Contact",
        "user": "Standard User",
    }
    role_label = role_label_map.get(payload.role, payload.role.replace("_", " ").title())

    # Check if user already exists
    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if user:
        # Update existing user role & credentials
        user.name = clean_name
        user.role = payload.role
        user.password_hash = hashed_pwd
        user.status = "ACTIVE"
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        action = "updated"
    else:
        # Create new active user
        user = User(
            name=clean_name,
            email=clean_email,
            password_hash=hashed_pwd,
            role=payload.role,
            status="ACTIVE",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        action = "created"

    # If role is customer, ensure customer record exists
    if payload.role == "customer":
        try:
            cust = db.query(Customer).filter(Customer.email.ilike(clean_email)).first()
            if not cust:
                new_cust = Customer(
                    customer_code=f"CUST-{user.id:04d}",
                    company_name=payload.company_name or clean_name,
                    contact_name=clean_name,
                    email=clean_email,
                    tier="Silver",
                    status="ACTIVE",
                )
                db.add(new_cust)
                db.commit()
        except Exception:
            db.rollback()

    # Dispatch Provisioning Email via Resend
    html_content = build_provisioning_email_html(
        full_name=clean_name,
        email=clean_email,
        role_label=role_label,
        password=raw_password,
        login_url=FRONTEND_URL,
        company_name=payload.company_name or "DealFlow360"
    )

    mail_res = send_email(
        to=clean_email,
        subject=f"DealFlow360 Access Provisioned: Your {role_label} Account Credentials",
        html=html_content
    )

    return {
        "success": True,
        "action": action,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "role_label": role_label,
            "status": user.status,
            "company_name": payload.company_name,
        },
        "credentials": {
            "email": clean_email,
            "password": raw_password,
        },
        "mail_status": mail_res,
        "message": f"User {clean_name} successfully {action} with role '{role_label}'. Credentials email dispatched.",
    }

@router.post("/send-message")
def send_admin_direct_message(payload: AdminDirectMessageRequest):
    """
    Admin endpoint to send an executive direct message email to any user.
    """
    clean_email = payload.recipient_email.strip().lower()
    html_content = build_admin_message_email_html(
        recipient_name=payload.recipient_name,
        subject=payload.subject,
        message_body=payload.message,
        sender_name=payload.sender_name or "Root Administrator (Sarah Connor)",
        priority=payload.priority or "Normal"
    )

    mail_res = send_email(
        to=clean_email,
        subject=f"[DealFlow360 Admin] {payload.subject}",
        html=html_content
    )

    return {
        "success": True,
        "recipient": clean_email,
        "subject": payload.subject,
        "mail_status": mail_res,
        "message": f"Message '{payload.subject}' sent to {clean_email}.",
    }
