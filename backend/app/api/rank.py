from fastapi import APIRouter
from pydantic import BaseModel
import sqlite3
from datetime import date, timedelta
import os

router = APIRouter()

DB_PATH = os.getenv("DB_PATH", "/tmp/ember.db")

class RankUpdate(BaseModel):
    goal_id: int

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_consecutive_nothing_or_unlogged(goal_id: int, days_back: int = 10):
    conn = get_db()
    cur = conn.cursor()
    # Get logs for last N days
    consecutive = 0
    for i in range(days_back):
        check_date = (date.today() - timedelta(days=i)).isoformat()
        cur.execute("SELECT result FROM logs WHERE goal_id = ? AND date = ?", (goal_id, check_date))
        row = cur.fetchone()
        if not row or row['result'] == 'N':
            consecutive += 1
        else:
            break
    conn.close()
    return consecutive

def get_consecutive_geq_realistic(goal_id: int, days_back: int = 10):
    conn = get_db()
    cur = conn.cursor()
    consecutive = 0
    for i in range(days_back):
        check_date = (date.today() - timedelta(days=i)).isoformat()
        cur.execute("SELECT result FROM logs WHERE goal_id = ? AND date = ?", (goal_id, check_date))
        row = cur.fetchone()
        if row and row['result'] in ['R', 'F']:  # Realistic or Floor counts as >= Realistic? "at least a Realistic run"
            consecutive += 1
        else:
            break
    conn.close()
    return consecutive

def get_consecutive_geq_floor(goal_id: int, days_back: int = 10):
    conn = get_db()
    cur = conn.cursor()
    consecutive = 0
    for i in range(days_back):
        check_date = (date.today() - timedelta(days=i)).isoformat()
        cur.execute("SELECT result FROM logs WHERE goal_id = ? AND date = ?", (goal_id, check_date))
        row = cur.fetchone()
        if row and row['result'] == 'F':
            consecutive += 1
        else:
            break
    conn.close()
    return consecutive

@router.post("/update")
def update_rank(update: RankUpdate):
    ranks = ['Spark', 'Kindle', 'Flame', 'Blaze', 'Inferno']
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT current_rank FROM rank WHERE goal_id = ?", (update.goal_id,))
    row = cur.fetchone()
    current = row['current_rank'] if row else 'Spark'
    idx = ranks.index(current) if current in ranks else 0
    
    # Check penalties
    consecutive_nothing = get_consecutive_nothing_or_unlogged(update.goal_id)
    if consecutive_nothing >= 2:
        if idx > 0:
            idx -= 1
            new_rank = ranks[idx]
            cur.execute("UPDATE rank SET current_rank = ? WHERE goal_id = ?", (new_rank, update.goal_id))
            cur.execute("INSERT INTO rank_history (goal_id, date, change, reason) VALUES (?, ?, ?, ?)",
                        (update.goal_id, date.today().isoformat(), -1, f'{consecutive_nothing} consecutive Nothing/unlogged'))
            conn.commit()
            conn.close()
            return {"rank": new_rank, "change": -1}
    
    # Check promotions
    consecutive_real = get_consecutive_geq_realistic(update.goal_id)
    if consecutive_real >= 3:
        idx = min(len(ranks) - 1, idx + 2)
        new_rank = ranks[idx]
        cur.execute("UPDATE rank SET current_rank = ? WHERE goal_id = ?", (new_rank, update.goal_id))
        cur.execute("INSERT INTO rank_history (goal_id, date, change, reason) VALUES (?, ?, ?, ?)",
                    (update.goal_id, date.today().isoformat(), 2, f'{consecutive_real} consecutive >= Realistic'))
        conn.commit()
        conn.close()
        return {"rank": new_rank, "change": 2}
    
    consecutive_floor = get_consecutive_geq_floor(update.goal_id)
    if consecutive_floor >= 3:
        idx = min(len(ranks) - 1, idx + 1)
        new_rank = ranks[idx]
        cur.execute("UPDATE rank SET current_rank = ? WHERE goal_id = ?", (new_rank, update.goal_id))
        cur.execute("INSERT INTO rank_history (goal_id, date, change, reason) VALUES (?, ?, ?, ?)",
                    (update.goal_id, date.today().isoformat(), 1, f'{consecutive_floor} consecutive Floor'))
        conn.commit()
        conn.close()
        return {"rank": new_rank, "change": 1}
    
    conn.close()
    return {"rank": current, "change": 0}
