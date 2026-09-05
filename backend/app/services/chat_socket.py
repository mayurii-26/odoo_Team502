# ============================================================
# DealFlow360 - Real-Time Socket.IO Server & Event Handlers
# ============================================================
import logging
from datetime import datetime
from typing import Dict, Set, Optional, Any
import socketio
from app.core.database import SessionLocal
from app.models.chat import Conversation, ChatMessage
from app.models.user import User

logger = logging.getLogger("dealflow360.chat")
logger.setLevel(logging.INFO)

# Async Socket.IO server with CORS enabled
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    ping_interval=25,
    ping_timeout=60,
    logger=False,
    engineio_logger=False,
)

# In-memory mapping from user_id to active socket IDs
user_socket_map: Dict[int, Set[str]] = {}
socket_user_map: Dict[str, int] = {}


def get_or_create_conversation(db, user_a_id: int, user_b_id: int) -> Conversation:
    """
    Finds or creates a unique canonical conversation between two users
    using user1_id < user2_id order.
    """
    u1 = min(user_a_id, user_b_id)
    u2 = max(user_a_id, user_b_id)

    conv = db.query(Conversation).filter(
        Conversation.user1_id == u1,
        Conversation.user2_id == u2
    ).first()

    if not conv:
        conv = Conversation(
            user1_id=u1,
            user2_id=u2,
            last_message="",
            last_message_type="text",
            last_message_at=datetime.utcnow(),
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    return conv


def serialize_message(msg: ChatMessage, temp_id: Optional[str] = None) -> Dict[str, Any]:
    """Helper to convert ChatMessage model to JSON-safe dictionary."""
    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "receiver_id": msg.receiver_id,
        "message_type": msg.message_type,
        "content": msg.content or "",
        "file_url": msg.file_url,
        "file_name": msg.file_name,
        "file_size": msg.file_size,
        "mime_type": msg.mime_type,
        "is_read": msg.is_read,
        "created_at": msg.created_at.isoformat() if msg.created_at else datetime.utcnow().isoformat(),
        "temp_id": temp_id,
    }


# ── Socket.IO Lifecycle Events ────────────────────────────────

@sio.event
async def connect(sid: str, environ: dict, auth: Optional[dict] = None):
    logger.info(f"[Socket.IO] Client connected: {sid}")


@sio.event
async def disconnect(sid: str):
    logger.info(f"[Socket.IO] Client disconnected: {sid}")
    user_id = socket_user_map.pop(sid, None)
    if user_id and user_id in user_socket_map:
        user_socket_map[user_id].discard(sid)
        if not user_socket_map[user_id]:
            del user_socket_map[user_id]


# ── Room & Identity Events ────────────────────────────────────

@sio.on("join_user")
async def handle_join_user(sid: str, data: dict):
    """
    Registers a connected user and joins their personal notification room.
    data format: {"user_id": int, "email": Optional[str]}
    """
    try:
        user_id = int(data.get("user_id", 0))
        if user_id <= 0:
            return {"status": "error", "message": "Invalid user_id"}

        room_name = f"user_{user_id}"
        await sio.enter_room(sid, room_name)

        if user_id not in user_socket_map:
            user_socket_map[user_id] = set()
        user_socket_map[user_id].add(sid)
        socket_user_map[sid] = user_id

        logger.info(f"[Socket.IO] User {user_id} joined room {room_name} (sid={sid})")
        return {"status": "ok", "room": room_name, "user_id": user_id}
    except Exception as e:
        logger.error(f"[Socket.IO] Error in join_user: {e}")
        return {"status": "error", "message": str(e)}


# ── Message Dispatch Events ───────────────────────────────────

@sio.on("send_message")
async def handle_send_message(sid: str, data: dict):
    """
    Saves a message to PostgreSQL and broadcasts in real-time to recipient & sender rooms.
    data format:
    {
        "sender_id": int,
        "receiver_id": int,
        "message_type": "text" | "image" | "pdf",
        "content": Optional[str],
        "file_url": Optional[str],
        "file_name": Optional[str],
        "file_size": Optional[int],
        "mime_type": Optional[str],
        "temp_id": Optional[str]
    }
    """
    sender_id = int(data.get("sender_id", 0))
    receiver_id = int(data.get("receiver_id", 0))
    message_type = data.get("message_type", "text").lower()
    content = (data.get("content") or "").strip()
    file_url = data.get("file_url")
    file_name = data.get("file_name")
    file_size = data.get("file_size")
    mime_type = data.get("mime_type")
    temp_id = data.get("temp_id")

    if sender_id <= 0 or receiver_id <= 0:
        return {"status": "error", "message": "Valid sender_id and receiver_id required"}

    if message_type not in ["text", "image", "pdf"]:
        message_type = "text"

    if message_type == "text" and not content:
        return {"status": "error", "message": "Text message content cannot be empty"}

    db = SessionLocal()
    try:
        # 1. Fetch or create conversation
        conv = get_or_create_conversation(db, sender_id, receiver_id)

        # 2. Persist message
        msg = ChatMessage(
            conversation_id=conv.id,
            sender_id=sender_id,
            receiver_id=receiver_id,
            message_type=message_type,
            content=content,
            file_url=file_url,
            file_name=file_name,
            file_size=file_size,
            mime_type=mime_type,
            is_read=False,
            created_at=datetime.utcnow(),
        )
        db.add(msg)

        # 3. Update conversation last message summary
        if message_type == "text":
            conv.last_message = content[:900]
        elif message_type == "image":
            conv.last_message = f"📷 Photo{(': ' + content) if content else ''}"[:900]
        elif message_type == "pdf":
            conv.last_message = f"📄 Document: {file_name or 'PDF'}"[:900]

        conv.last_message_type = message_type
        conv.last_message_at = msg.created_at
        conv.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(msg)

        serialized = serialize_message(msg, temp_id=temp_id)

        # 4. Real-time broadcast to receiver room
        receiver_room = f"user_{receiver_id}"
        await sio.emit("receive_message", serialized, room=receiver_room)

        # 5. Broadcast confirmation to sender room (all sender tabs)
        sender_room = f"user_{sender_id}"
        await sio.emit("message_sent", serialized, room=sender_room)

        logger.info(f"[Socket.IO] Message {msg.id} ({message_type}) delivered from {sender_id} to {receiver_id}")
        return {"status": "ok", "message": serialized}
    except Exception as e:
        db.rollback()
        logger.error(f"[Socket.IO] Failed to save/send message: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


# ── Typing Indicators ─────────────────────────────────────────

@sio.on("typing")
async def handle_typing(sid: str, data: dict):
    sender_id = int(data.get("sender_id", 0))
    receiver_id = int(data.get("receiver_id", 0))
    if receiver_id > 0:
        await sio.emit("user_typing", {"user_id": sender_id, "is_typing": True}, room=f"user_{receiver_id}")


@sio.on("stop_typing")
async def handle_stop_typing(sid: str, data: dict):
    sender_id = int(data.get("sender_id", 0))
    receiver_id = int(data.get("receiver_id", 0))
    if receiver_id > 0:
        await sio.emit("user_typing", {"user_id": sender_id, "is_typing": False}, room=f"user_{receiver_id}")


# ── Read Receipts ─────────────────────────────────────────────

@sio.on("mark_read")
async def handle_mark_read(sid: str, data: dict):
    conversation_id = int(data.get("conversation_id", 0))
    user_id = int(data.get("user_id", 0))

    if conversation_id <= 0 or user_id <= 0:
        return

    db = SessionLocal()
    try:
        updated_count = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conversation_id,
            ChatMessage.receiver_id == user_id,
            ChatMessage.is_read == False
        ).update({"is_read": True})

        db.commit()

        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv and updated_count > 0:
            other_user_id = conv.user2_id if conv.user1_id == user_id else conv.user1_id
            await sio.emit("messages_read", {
                "conversation_id": conversation_id,
                "read_by_user_id": user_id,
            }, room=f"user_{other_user_id}")
    except Exception as e:
        logger.error(f"[Socket.IO] Failed to mark messages as read: {e}")
    finally:
        db.close()
