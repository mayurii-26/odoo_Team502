# ============================================================
# DealFlow360 — Security Utilities
# ============================================================
# Responsibilities:
#   - Password hashing (bcrypt via passlib)
#   - JWT creation and validation
#   - Invite token generation
#   - get_current_user dependency for protected routes
#   - Role-based permission checks
# ============================================================

# TODO: implement when starting backend development
#
# from datetime import datetime, timedelta
# from passlib.context import CryptContext
# from jose import jwt, JWTError
# from app.core.config import settings
#
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
#
# def hash_password(password: str) -> str:
#     return pwd_context.hash(password)
#
# def verify_password(plain: str, hashed: str) -> bool:
#     return pwd_context.verify(plain, hashed)
#
# def create_access_token(data: dict) -> str:
#     payload = data.copy()
#     payload["exp"] = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
#     return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
#
# def create_invite_token(email: str, role: str) -> str:
#     payload = {
#         "email": email,
#         "role": role,
#         "exp": datetime.utcnow() + timedelta(hours=settings.INVITE_TOKEN_EXPIRE_HOURS),
#         "type": "invite"
#     }
#     return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
#
# async def get_current_user(token: str) -> dict:
#     # Decode JWT, load user from DB, return user object
#     ...
#
# def require_role(*roles: str):
#     # FastAPI dependency — raises 403 if user role not in allowed roles
#     ...
