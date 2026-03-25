from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# pull in .env values if present
load_dotenv()

# prefer POSTGRES_URL for connection string, then fallback to sqlite when not set.
DATABASE_URL = (
    os.getenv("POSTGRES_URL")
    or "sqlite:///./data/local.db"
)

# Expand embedded env vars like ${POSTGRES_USER} in PostgreSQL URL templates.
DATABASE_URL = os.path.expandvars(DATABASE_URL)

# SQLAlchemy 2.0 requires the dialect name "postgresql"; some postgres urls still use
# the legacy "postgres://" scheme, which results in a NoSuchModuleError.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLAlchemy recommends passing `future=True` for 2.0 style
engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()
