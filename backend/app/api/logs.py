from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date
from app.services import db

router = APIRouter()

class LogEntry(BaseModel):
    goal_id: int
    result: str  # S, R, F, N

@router.post("/log")
def log_day(entry: LogEntry):
    conn = db.get_conn()
    cur = conn.cursor()
    today = date.today().isoformat()
    # upsert: one log per goal per day
    cur.execute("SELECT id FROM logs WHERE goal_id = ? AND date = ?", (entry.goal_id, today))
    row = cur.fetchone()
    if row:
        cur.execute("UPDATE logs SET result = ? WHERE id = ?", (entry.result, row['id']))
        log_id = row['id']
    else:
        cur.execute("INSERT INTO logs (goal_id, date, result) VALUES (?, ?, ?)", 
                    (entry.goal_id, today, entry.result))
        log_id = cur.lastrowid
    conn.commit()
    conn.close()
    return {"id": log_id, "date": today, "result": entry.result}

@router.get("/logs/{goal_id}")
def get_logs(goal_id: int):
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM logs WHERE goal_id = ? ORDER BY date DESC", (goal_id,))
    rows = cur.fetchall()
    conn.close()
    return [dict(row) for row in rows]
