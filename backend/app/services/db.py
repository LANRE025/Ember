import sqlite3
import os
from datetime import datetime

DB_PATH = os.getenv("DB_PATH", "/tmp/ember.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('''CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        why TEXT,
        created_at TEXT
    )''')
    cur.execute('''CREATE TABLE IF NOT EXISTS bands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER,
        stretch INTEGER,
        realistic INTEGER,
        floor INTEGER,
        updated_at TEXT
    )''')
    cur.execute('''CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER,
        date TEXT,
        result TEXT
    )''')
    cur.execute('''CREATE TABLE IF NOT EXISTS rank (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER,
        current_rank TEXT,
        updated_at TEXT
    )''')
    cur.execute('''CREATE TABLE IF NOT EXISTS rank_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER,
        date TEXT,
        change INTEGER,
        reason TEXT
    )''')
    cur.execute('''CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER,
        badge TEXT,
        earned_at TEXT
    )''')
    cur.execute('''CREATE TABLE IF NOT EXISTS week_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER,
        week_start TEXT,
        logs_snapshot TEXT,
        proposal TEXT,
        accepted_at TEXT
    )''')
    cur.execute('''CREATE TABLE IF NOT EXISTS quests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER,
        date TEXT,
        quest1 TEXT,
        step1 TEXT,
        quest2 TEXT,
        step2 TEXT,
        quest3 TEXT,
        step3 TEXT
    )''')
    conn.commit()
    conn.close()

def create_goal(name, why):
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO goals (name, why, created_at) VALUES (?, ?, ?)", (name, why, datetime.now().isoformat()))
    conn.commit()
    gid = cur.lastrowid
    # Set default bands
    cur.execute("INSERT INTO bands (goal_id, stretch, realistic, floor, updated_at) VALUES (?, ?, ?, ?, ?)",
                (gid, 5, 3, 1, datetime.now().isoformat()))
    conn.close()
    return gid

def get_goal():
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM goals ORDER BY id DESC LIMIT 1")
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None

def get_bands(goal_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM bands WHERE goal_id = ? ORDER BY id DESC LIMIT 1", (goal_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None

def init_rank(goal_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT OR IGNORE INTO rank (goal_id, current_rank, updated_at) VALUES (?, ?, ?)",
                (goal_id, 'Spark', datetime.now().isoformat()))
    conn.commit()
    conn.close()

def get_rank(goal_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM rank WHERE goal_id = ?", (goal_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None

def update_bands(goal_id, stretch, realistic, floor):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO bands (goal_id, stretch, realistic, floor, updated_at) VALUES (?, ?, ?, ?, ?)",
                (goal_id, stretch, realistic, floor, datetime.now().isoformat()))
    conn.commit()
    conn.close()
