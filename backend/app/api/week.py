from fastapi import APIRouter
from pydantic import BaseModel
import sqlite3
from datetime import date, timedelta
import os

router = APIRouter()

DB_PATH = os.getenv("DB_PATH", "/tmp/ember.db")

class WeekCheck(BaseModel):
    goal_id: int

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@router.get("/check/{goal_id}")
def week_check(goal_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as cnt FROM logs WHERE goal_id = ?", (goal_id,))
    count = cur.fetchone()['cnt']
    if count < 3:
        conn.close()
        return {"unlocked": False, "message": "Begin your journey to view your conquests.", "progress": f"{count} of 3 nights"}
    
    # Get last 7 days
    logs = []
    for i in range(7):
        check_date = (date.today() - timedelta(days=i+1)).isoformat()
        cur.execute("SELECT result FROM logs WHERE goal_id = ? AND date = ?", (goal_id, check_date))
        row = cur.fetchone()
        if row:
            logs.append(row['result'])
        else:
            logs.append('N')  # unlogged counts as Nothing
    
    s = logs.count('S')
    r = logs.count('R')
    f_count = logs.count('F')
    n = logs.count('N')
    
    proposal = f"Stretch 5 → 4 a week." if s >= 1 else "Bands look good."
    
    conn.close()
    return {
        "unlocked": True,
        "logs": logs,
        "evidence": f"You hit Stretch on {s} of 7 nights, and Realistic or better on {s+r}. You met your Floor all {f_count + r + s} nights.",
        "proposal": proposal,
        "badge": "Honest Week"
    }
