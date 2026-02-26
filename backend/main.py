from fastapi import FastAPI
from dotenv import load_dotenv

# load environment variables from .env file (development)
load_dotenv()

# import the interaction model so that SQLAlchemy is aware of it
import models.interaction  # noqa: F401 (import for side effects)
from db import engine

app = FastAPI()

# register sub-routers
from routes import chat, history
app.include_router(chat.router)
app.include_router(history.router)

# create database tables on startup
@app.on_event("startup")
def startup_event():
    # use Base from db since that's where it is defined
    import db as _db
    _db.Base.metadata.create_all(bind=engine)

# chat/ollama endpoints are handled in routes/chat.py
# persistence routes live in routes/history.py
