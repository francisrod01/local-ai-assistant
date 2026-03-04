from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from crud import interaction
import db

router = APIRouter()


class InteractionCreate(BaseModel):
    prompt: str
    response: str
    user: str = "user_1"


from pydantic import ConfigDict

class InteractionOut(BaseModel):
    id: int
    prompt: str
    response: str
    user: str
    created_at: datetime

    # Pydantic v2 style config: `orm_mode` replaced by
    # `from_attributes` and we supply a ConfigDict instance.
    model_config = ConfigDict(from_attributes=True)


def get_db():
    db_session = db.SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()


@router.post("/history", response_model=InteractionOut)
def create_history_item(item: InteractionCreate, db: Session = Depends(get_db)):
    inter = interaction.create_interaction(db, item.user, item.prompt, item.response)
    return inter


@router.get("/history")
def list_history(db: Session = Depends(get_db)):
    rows = interaction.list_interactions(db, "user_1")
    return [InteractionOut.from_orm(r) for r in rows]


@router.get("/history/{item_id}", response_model=InteractionOut)
def get_history_item(item_id: int, db: Session = Depends(get_db)):
    row = interaction.get_interaction(db, item_id, "user_1")
    if not row:
        raise HTTPException(status_code=404, detail="Item not found")
    return row


@router.delete("/history")
def clear_history(db: Session = Depends(get_db)):
    interaction.clear_interactions(db, "user_1")
    return {"status": "ok"}
