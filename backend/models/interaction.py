from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from db import Base


class InteractionModel(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String, index=True)
    conversation_id = Column(String, index=True, nullable=True)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
