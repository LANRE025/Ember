from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
from datetime import date, datetime, timedelta
import os

router = APIRouter()

DB_PATH = os.getenv("DB_PATH", "/tmp/ember.db")

class LogEntry(BaseModel):
    goal_id: int
    result: str  # S, R, F, N

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@router.post("/log")
def log_day(entry: LogEntry):
    conn = get_db()
    cur = conn.cursor()
    today = date.today().isoformat()
    cur.execute("INSERT INTO logs (goal_id, date, result) VALUES (?, ?, ?)", 
                (entry.goal_id, today, entry.result))
    conn.commit()
    log_id = cur.lastrowid
    conn.close()
    return {"id": log_id, "date": today, "result": entry.result}

@router.get("/logs/{goal_id}")
def get_logs(goal_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM logs WHERE goal_id = ? ORDER BY date DESC", (goal_id,))
    rows = cur.fetchall()
    conn.close()
    return [dict(row) for row in rows]
