from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date, timedelta, datetime
import json
from app.services import db
from app.services import ai_client
from app.services import prompts

WEEK_UNLOCK_NIGHTS = 3

router = APIRouter()

class WeekCheck(BaseModel):
    goal_id: int

class WeekAnswer(BaseModel):
    checkin_id: int
    question_id: str
    answer: str

class WeekRespond(BaseModel):
    checkin_id: int
    accept: bool

@router.get("/overview/{goal_id}")
def week_overview(goal_id: int):
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM goals WHERE id = ?", (goal_id,))
    goal = cur.fetchone()
    goal_dict = dict(goal) if goal else {}
    cur.execute("SELECT DISTINCT date FROM logs WHERE goal_id = ? ORDER BY date ASC", (goal_id,))
    log_dates = [r['date'] for r in cur.fetchall()]
    count = len(log_dates)
    created = goal_dict.get('created_at')
    just_starting = count < WEEK_UNLOCK_NIGHTS
    # build last 7
    logs_last7 = []
    for i in range(7):
        d = (date.today() - timedelta(days=i)).isoformat()
        cur.execute("SELECT result FROM logs WHERE goal_id = ? AND date = ?", (goal_id, d))
        row = cur.fetchone()
        if row:
            logs_last7.append(row['result'])
        else:
            logs_last7.append('N')
    conn.close()
    if just_starting:
        return {"unlocked": False, "just_starting": True, "message": "Begin your journey to view your conquests.", "progress": f"{count} of {WEEK_UNLOCK_NIGHTS} nights", "nights_logged_so_far": count, "last7_message": "We'll see how well you've done in a week", "logs": logs_last7}
    return {"unlocked": True, "just_starting": False, "logs": logs_last7, "nights_logged": count}

@router.get("/check/{goal_id}")
def week_check(goal_id: int):
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(DISTINCT date) as cnt FROM logs WHERE goal_id = ?", (goal_id,))
    row = cur.fetchone()
    count = row['cnt'] if row else 0
    if count < WEEK_UNLOCK_NIGHTS:
        conn.close()
        return {"unlocked": False, "message": "Begin your journey to view your conquests.", "progress": f"{count} of {WEEK_UNLOCK_NIGHTS} nights"}
    
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

@router.post("/start/{goal_id}")
def week_start(goal_id: int):
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM goals WHERE id = ?", (goal_id,))
    goal = cur.fetchone()
    goal_dict = dict(goal) if goal else {}
    cur.execute("SELECT * FROM bands WHERE goal_id = ? ORDER BY id DESC LIMIT 1", (goal_id,))
    bands = cur.fetchone()
    bands_dict = dict(bands) if bands else {}
    logs_last7 = []
    for i in range(7):
        d = (date.today() - timedelta(days=i)).isoformat()
        cur.execute("SELECT result FROM logs WHERE goal_id = ? AND date = ?", (goal_id, d))
        row = cur.fetchone()
        logs_last7.append(row['result'] if row else 'N')
    try:
        from pydantic import BaseModel as BM
        class Q(BM):
            id: str
            text: str
        class Qs(BM):
            questions: list[Q]
        system = prompts.SYSTEM_PROMPT.format(context="You generate week evaluation questions.")
        user = prompts.WEEK_QUESTIONS_PROMPT.format(name=goal_dict.get('name',''), category=goal_dict.get('category','general'), logs_json=json.dumps(logs_last7), bands_json=json.dumps(bands_dict))
        res = ai_client.ai_client.generate_json(system, user, Qs, model_name=ai_client.ai_client.model)
        questions = [q.model_dump() if hasattr(q,'model_dump') else q.dict() for q in res.questions][:3]
    except Exception:
        raise HTTPException(status_code=503, detail={"fallback": True, "message": "AI unavailable."})
    week_start = (date.today() - timedelta(days=6)).isoformat()
    cur.execute("INSERT INTO week_checkins (goal_id, week_start, logs_snapshot, questions_json, status) VALUES (?,?,?,?,?)",
                (goal_id, week_start, json.dumps(logs_last7), json.dumps(questions), 'started'))
    cid = cur.lastrowid
    conn.commit()
    conn.close()
    return {"checkin_id": cid, "questions": questions}

@router.post("/answer")
def week_answer(a: WeekAnswer):
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM week_checkins WHERE id = ?", (a.checkin_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="not found")
    wc = dict(row)
    answers = json.loads(wc.get('answers_json') or '[]')
    # update
    answers = [x for x in answers if x.get('question_id') != a.question_id]
    answers.append({"question_id": a.question_id, "answer": a.answer})
    cur.execute("UPDATE week_checkins SET answers_json = ? WHERE id = ?", (json.dumps(answers), a.checkin_id))
    conn.commit()
    conn.close()
    return {"ok": True}

@router.post("/propose")
def week_propose(body: dict):
    checkin_id = body.get('checkin_id')
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM week_checkins WHERE id = ?", (checkin_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="not found")
    wc = dict(row)
    questions = json.loads(wc.get('questions_json') or '[]')
    answers = json.loads(wc.get('answers_json') or '[]')
    if len(answers) < len(questions) or len(questions) == 0 or len(answers) < 3:
        conn.close()
        raise HTTPException(status_code=409, detail="answer all questions")
    goal_id = wc['goal_id']
    cur.execute("SELECT * FROM goals WHERE id = ?", (goal_id,))
    goal = cur.fetchone()
    goal_dict = dict(goal) if goal else {}
    cur.execute("SELECT * FROM bands WHERE goal_id = ? ORDER BY id DESC LIMIT 1", (goal_id,))
    bands = cur.fetchone()
    bands_dict = dict(bands) if bands else {}
    logs_last7 = json.loads(wc.get('logs_snapshot') or '[]')
    cur.execute("SELECT * FROM rank_history WHERE goal_id = ? ORDER BY id DESC LIMIT 10", (goal_id,))
    rh = [dict(r) for r in cur.fetchall()]
    conn.close()
    try:
        from pydantic import BaseModel as BM
        class Prop(BM):
            band: str
            from_: int = None
            to: int = None
            reason: str
            evidence_text: str
            class Config:
                fields = {'from_': 'from'}
        class PropResp(BM):
            proposal: Prop
        system = prompts.SYSTEM_PROMPT.format(context="You propose week band changes for Ember.")
        user = prompts.WEEK_PROPOSE_PROMPT.format(name=goal_dict.get('name',''), logs_json=json.dumps(logs_last7), bands_json=json.dumps(bands_dict), rank_history_json=json.dumps(rh), answers_json=json.dumps(answers))
        res = ai_client.ai_client.generate_json(system, user, PropResp, model_name=ai_client.ai_client.model)
        prop = res.proposal.model_dump() if hasattr(res.proposal,'model_dump') else res.proposal.dict()
        # enforce
        n_nothing = logs_last7.count('N')
        if prop.get('band') == 'floor' and n_nothing < 3:
            prop['band'] = 'none'
        conn = db.get_conn()
        cur = conn.cursor()
        cur.execute("UPDATE week_checkins SET proposal = ? WHERE id = ?", (json.dumps(prop), checkin_id))
        conn.commit()
        conn.close()
        return {"proposal": prop}
    except Exception:
        raise HTTPException(status_code=503, detail={"fallback": True, "message": "AI unavailable."})

@router.post("/respond")
def week_respond(r: WeekRespond):
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM week_checkins WHERE id = ?", (r.checkin_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="not found")
    wc = dict(row)
    if not r.accept:
        cur.execute("UPDATE week_checkins SET accepted_at = NULL WHERE id = ?", (r.checkin_id,))
        conn.commit()
        conn.close()
        return {"ok": True}
    prop = json.loads(wc.get('proposal') or '{}')
    goal_id = wc['goal_id']
    if prop.get('band') in ['stretch','realistic','floor'] and prop.get('to') is not None:
        bands = db.get_bands(goal_id)
        s = bands.get('stretch') or 5
        real = bands.get('realistic') or 3
        f = bands.get('floor') or 1
        to = int(prop['to'])
        if prop['band'] == 'stretch':
            s = to
        elif prop['band'] == 'realistic':
            real = to
        elif prop['band'] == 'floor':
            if to < 1: to = 1
            f = to
        db.update_bands(goal_id, s, real, f)
        cur.execute("INSERT INTO rank_history (goal_id, date, change, reason) VALUES (?,?,?,?)", (goal_id, date.today().isoformat(), 0, prop.get('evidence_text') or prop.get('reason') or ''))
    cur.execute("UPDATE week_checkins SET accepted_at = ? WHERE id = ?", (datetime.now().isoformat(), r.checkin_id))
    conn.commit()
    conn.close()
    return {"ok": True, "badge": "Honest Week"}
