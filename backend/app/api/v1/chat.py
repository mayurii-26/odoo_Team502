# ============================================================
# DealFlow360 - Chat REST API & File Upload Endpoints
# ============================================================
import os
import re
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.core.database import get_db
from app.models.user import User
from app.models.chat import Conversation, ChatMessage
from app.services.chat_socket import sio, get_or_create_conversation, serialize_message

router = APIRouter()

# Uploads directory configuration
UPLOAD_BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads")
CHAT_UPLOAD_DIR = os.path.join(UPLOAD_BASE_DIR, "chat")
os.makedirs(CHAT_UPLOAD_DIR, exist_ok=True)

# Allowed file extensions and MIME types
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_PDF_EXTENSIONS = {".pdf"}
ALLOWED_PDF_MIMES = {"application/pdf"}

MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024   # 15 MB
MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024     # 25 MB


class MessageCreate(BaseModel):
    sender_id: int
    receiver_id: int
    message_type: str = "text"  # 'text', 'image', 'pdf'
    content: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    temp_id: Optional[str] = None


class MarkReadRequest(BaseModel):
    conversation_id: int
    user_id: int


def sanitize_filename(filename: str) -> str:
    """Sanitize user-provided filename to prevent path traversal and shell injection."""
    name, ext = os.path.splitext(filename)
    clean_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", name)[:60]
    return f"{clean_name}{ext.lower()}"


# ── 1. Users Directory for Chat ───────────────────────────────

@router.get("/users")
def get_chat_users(
    current_user_id: Optional[int] = None,
    exclude_current: bool = False,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns available user contacts across all roles (Sales, Managers, Finance, Customers, Admin)
    for starting or continuing 1-to-1 chats.
    """
    query = db.query(User).filter(User.status == "ACTIVE")

    if current_user_id and exclude_current:
        query = query.filter(User.id != current_user_id)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(or_(User.name.ilike(search_term), User.email.ilike(search_term)))

    users = query.order_by(User.name.asc()).all()

    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "status": u.status,
            "reporting_manager": u.reporting_manager,
        }
        for u in users
    ]


# ── 2. Conversations List ─────────────────────────────────────

@router.get("/conversations")
def get_conversations(
    user_id: int = Query(..., description="ID of the current user"),
    db: Session = Depends(get_db)
):
    """
    Returns all active conversations involving the specified user,
    with other user metadata and unread counts.
    """
    convs = db.query(Conversation).filter(
        or_(Conversation.user1_id == user_id, Conversation.user2_id == user_id)
    ).order_by(Conversation.last_message_at.desc()).all()

    result = []
    for c in convs:
        other_user_id = c.user2_id if c.user1_id == user_id else c.user1_id
        other_user = db.query(User).filter(User.id == other_user_id).first()

        unread_count = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == c.id,
            ChatMessage.receiver_id == user_id,
            ChatMessage.is_read == False
        ).count()

        result.append({
            "id": c.id,
            "user1_id": c.user1_id,
            "user2_id": c.user2_id,
            "last_message": c.last_message,
            "last_message_type": c.last_message_type,
            "last_message_at": c.last_message_at.isoformat() if c.last_message_at else None,
            "unread_count": unread_count,
            "recipient": {
                "id": other_user.id if other_user else other_user_id,
                "name": other_user.name if other_user else f"User {other_user_id}",
                "email": other_user.email if other_user else "",
                "role": other_user.role if other_user else "User",
            },
        })

    return result


# ── 3. Messages History ───────────────────────────────────────

@router.get("/messages")
def get_messages(
    conversation_id: Optional[int] = None,
    user1_id: Optional[int] = None,
    user2_id: Optional[int] = None,
    user_id: Optional[int] = None,
    other_user_id: Optional[int] = None,
    limit: int = 150,
    db: Session = Depends(get_db)
):
    """
    Retrieves message history for a conversation or between two users.
    """
    u1 = user1_id or user_id
    u2 = user2_id or other_user_id

    if conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    elif u1 and u2:
        conv = get_or_create_conversation(db, u1, u2)
    else:
        raise HTTPException(status_code=400, detail="Provide conversation_id or both user1_id and user2_id")

    if not conv:
        return []

    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conv.id
    ).order_by(ChatMessage.created_at.asc()).limit(limit).all()

    return [serialize_message(m) for m in messages]


# ── 4. Send Message (REST Fallback) ───────────────────────────

@router.post("/messages")
async def send_message_rest(
    payload: MessageCreate,
    db: Session = Depends(get_db)
):
    """
    Sends a message via REST API, persists to PostgreSQL, and broadcasts live via Socket.IO.
    """
    if payload.sender_id <= 0 or payload.receiver_id <= 0:
        raise HTTPException(status_code=400, detail="Valid sender_id and receiver_id required")

    msg_type = payload.message_type.lower()
    if msg_type not in ["text", "image", "pdf"]:
        msg_type = "text"

    content = (payload.content or "").strip()
    if msg_type == "text" and not content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    conv = get_or_create_conversation(db, payload.sender_id, payload.receiver_id)

    msg = ChatMessage(
        conversation_id=conv.id,
        sender_id=payload.sender_id,
        receiver_id=payload.receiver_id,
        message_type=msg_type,
        content=content,
        file_url=payload.file_url,
        file_name=payload.file_name,
        file_size=payload.file_size,
        mime_type=payload.mime_type,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.add(msg)

    if msg_type == "text":
        conv.last_message = content[:900]
    elif msg_type == "image":
        conv.last_message = f"📷 Photo{(': ' + content) if content else ''}"[:900]
    elif msg_type == "pdf":
        conv.last_message = f"📄 Document: {payload.file_name or 'PDF'}"[:900]

    conv.last_message_type = msg_type
    conv.last_message_at = msg.created_at
    conv.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(msg)

    serialized = serialize_message(msg, temp_id=payload.temp_id)

    # Real-time broadcasts
    await sio.emit("receive_message", serialized, room=f"user_{payload.receiver_id}")
    await sio.emit("message_sent", serialized, room=f"user_{payload.sender_id}")

    return serialized


# ── 5. File Upload API with Strict Validation ─────────────────

@router.post("/upload")
async def upload_chat_file(file: UploadFile = File(...)):
    """
    Uploads and validates an image or PDF attachment for chat.
    Allowed:
    - Images: JPG, JPEG, PNG, WebP (max 15MB)
    - Documents: PDF (max 25MB)
    """
    orig_filename = file.filename or "attachment"
    ext = os.path.splitext(orig_filename)[1].lower()
    content_type = (file.content_type or "").lower()

    # Extension and MIME validation
    is_image = ext in ALLOWED_IMAGE_EXTENSIONS or content_type in ALLOWED_IMAGE_MIMES
    is_pdf = ext in ALLOWED_PDF_EXTENSIONS or content_type in ALLOWED_PDF_MIMES

    if not (is_image or is_pdf):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Only JPG, PNG, WebP images and PDF documents are permitted."
        )

    # Read content to check size
    file_bytes = await file.read()
    file_size = len(file_bytes)

    if is_image and file_size > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Image exceeds maximum allowable size of 15MB (uploaded size: {file_size / (1024 * 1024):.1f}MB)"
        )

    if is_pdf and file_size > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"PDF document exceeds maximum allowable size of 25MB (uploaded size: {file_size / (1024 * 1024):.1f}MB)"
        )

    # Generate unique safe stored filename
    safe_name = sanitize_filename(orig_filename)
    unique_filename = f"{uuid.uuid4().hex}_{safe_name}"
    disk_path = os.path.join(CHAT_UPLOAD_DIR, unique_filename)

    with open(disk_path, "wb") as f:
        f.write(file_bytes)

    file_url = f"/uploads/chat/{unique_filename}"
    message_type = "pdf" if is_pdf else "image"

    return {
        "status": "ok",
        "file_url": file_url,
        "file_name": orig_filename,
        "file_size": file_size,
        "message_type": message_type,
        "mime_type": content_type or ("application/pdf" if is_pdf else "image/jpeg"),
    }


# ── 6. Mark Conversation Read ─────────────────────────────────

@router.post("/read")
async def mark_conversation_read(
    payload: MarkReadRequest,
    db: Session = Depends(get_db)
):
    """
    Marks all unread messages in a conversation as read for the current user.
    """
    updated_count = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == payload.conversation_id,
        ChatMessage.receiver_id == payload.user_id,
        ChatMessage.is_read == False
    ).update({"is_read": True})

    db.commit()

    conv = db.query(Conversation).filter(Conversation.id == payload.conversation_id).first()
    if conv and updated_count > 0:
        other_user_id = conv.user2_id if conv.user1_id == payload.user_id else conv.user1_id
        await sio.emit("messages_read", {
            "conversation_id": payload.conversation_id,
            "read_by_user_id": payload.user_id,
        }, room=f"user_{other_user_id}")

    return {"status": "ok", "updated_count": updated_count}
