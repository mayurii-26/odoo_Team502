# ============================================================
# DealFlow360 - Chat & Real-Time Messaging Database Models
# ============================================================
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Conversation(Base):
    """
    Represents a one-to-one conversation between two users.
    Enforces user1_id < user2_id convention for unique canonical pair lookup.
    """
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    last_message = Column(String(1000), nullable=True)
    last_message_type = Column(String(20), nullable=False, default="text")
    last_message_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    messages = relationship(
        "ChatMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at.asc()"
    )


class ChatMessage(Base):
    """
    Represents an individual message in a conversation.
    Supports text, image, and pdf message types.
    """
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    message_type = Column(String(20), nullable=False, default="text")  # 'text', 'image', 'pdf'
    content = Column(String(5000), nullable=True)                      # Text or image/file caption
    file_url = Column(String(500), nullable=True)                      # URL/path to stored file
    file_name = Column(String(255), nullable=True)                     # Original filename e.g. quote.pdf
    file_size = Column(Integer, nullable=True)                         # Size in bytes
    mime_type = Column(String(100), nullable=True)                     # e.g. image/png, application/pdf
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
