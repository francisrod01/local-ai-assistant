from sqlalchemy.orm import Session
from models import interaction


def create_interaction(db: Session, user: str, prompt: str, response: str):
    inter = interaction.InteractionModel(user=user, prompt=prompt, response=response)
    db.add(inter)
    db.commit()
    db.refresh(inter)
    return inter


def list_interactions(db: Session, user: str):
    return (
        db.query(interaction.InteractionModel)
        .filter(interaction.InteractionModel.user == user)
        .order_by(interaction.InteractionModel.created_at.desc())
        .all()
    )


def get_interaction(db: Session, item_id: int, user: str):
    return (
        db.query(interaction.InteractionModel)
        .filter(interaction.InteractionModel.id == item_id, interaction.InteractionModel.user == user)
        .first()
    )


def clear_interactions(db: Session, user: str):
    db.query(interaction.InteractionModel).filter(interaction.InteractionModel.user == user).delete()
    db.commit()
