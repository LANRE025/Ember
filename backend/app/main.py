from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging; logging.basicConfig(level=logging.INFO)
from dotenv import load_dotenv
load_dotenv()
from app.api import logs, rank, ai, week, setup, goals
from app.services import db

app = FastAPI(title="Ember API", version="0.1.0")

@app.on_event("startup")
def on_startup():
    try:
        db.init_db()
    except Exception:
        pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(logs.router, prefix="/logs", tags=["logs"])
app.include_router(rank.router, prefix="/rank", tags=["rank"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(week.router, prefix="/week", tags=["week"])
app.include_router(setup.router, prefix="/setup", tags=["setup"])
app.include_router(goals.router, prefix="/goals", tags=["goals"])


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"ok": True}
