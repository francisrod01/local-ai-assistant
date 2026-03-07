from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# pull in .env values if present
load_dotenv()

# prefer DATABASE_URL for compatibility, then POSTGRES_URL; finally fall back
# to a local sqlite file when no environment variable is provided.
DATABASE_URL = (
    os.getenv("DATABASE_URL")
    or os.getenv("POSTGRES_URL")
    or "sqlite:///./data/local.db"
)

# SQLAlchemy 2.0 requires the dialect name "postgresql"; some postgres urls still use
# the legacy "postgres://" scheme, which results in a NoSuchModuleError.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLAlchemy recommends passing `future=True` for 2.0 style
engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()
