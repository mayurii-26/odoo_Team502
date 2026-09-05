# ============================================================
# DealFlow360 - PostgreSQL Database Connection (SQLAlchemy)
# ============================================================
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables from .env
load_dotenv()

# PostgreSQL Database URL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/dealflow360"
)

# Standardize URL for synchronous SQLAlchemy engine
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Normalize SSL parameters for psycopg2 (Neon / Cloud PostgreSQL)
if "?ssl=require" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("?ssl=require", "?sslmode=require")
elif "&ssl=require" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("&ssl=require", "&sslmode=require")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
