from fastapi import APIRouter
from pydantic import BaseModel
import sqlite3
import os

router = APIRouter()

DB_PATH = os.getenv("DB_PATH", "/tmp/ember.db")

class BrainDump(BaseModel):
    goal_id: int
    text: str

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@router.post("/shutdown")
def evening_shutdown(dump: BrainDump):
    # For PoC, generate simple top 3 quests
    quests = [
        {"id": 1, "text": "Do the smallest version of your goal", "step": "Start for 5 minutes"},
        {"id": 2, "text": "Clear one small task", "step": "Pick the easiest one"},
        {"id": 3, "text": "Prepare for tomorrow", "step": "Set out what you need"},
    ]
    return {"quests": quests, "message": "Quest Complete"}
