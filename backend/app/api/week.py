from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date, timedelta, datetime
import json
import logging
from app.services import db
from app.services import ai_client
from app.services import prompts

log = logging.getLogger("ember.week")

WEEK_UNLOCK_NIGHTS = 3      # the Week evaluation unlocks after this many logged nights
JUST_STARTING_DAYS = 7      # "Last 7 Days" shows the just-starting message until the goal is this old
STEP_FRACTION = 0.25        # one "step" for Stretch/Realistic = 25% of the current value (at least 1)
LAST7_JUST_STARTING_MESSAGE = "We'll see how well you've done by the end of the week"

router = APIRouter()


class WeekAnswer(BaseModel):
    checkin_id: int
    question_id: str
    answer: str


class WeekRespond(BaseModel):
    checkin_id: int
    accept: bool


def _last7(cur, goal_id: int):
    """Result letters for the last 7 days, today first. Unlogged days count as Nothing ('N')."""
    out = []
    for i in range(7):
        d = (date.today() - timedelta(days=i)).isoformat()
        cur.execute("SELECT result FROM logs WHERE goal_id = ? AND date = ?", (goal_id, d))
        row = cur.fetchone()
        out.append(row['result'] if row else 'N')
    return out


def _latest_bands(cur, goal_id: int):
    cur.execute("SELECT * FROM bands WHERE goal_id = ? ORDER BY id DESC LIMIT 1", (goal_id,))
    row = cur.fetchone()
    return dict(row) if row else {}


def sanitize_proposal(prop: dict, bands: dict, logs: list) -> dict:
    """Enforce the product rules in code, whatever the AI said.

    - at most ONE band changes, by ONE step
    - the Floor only changes after 3+ Nothing days in the last 7, down one step, never below 1
    - the ladder floor < realistic < stretch must still hold
    Anything else becomes a "no change" proposal.
    """
    no_change = {
        "band": "none", "from": None, "to": None,
        "reason": prop.get("reason", "") or "Your bands hold.",
        "evidence_text": prop.get("evidence_text", ""),
    }
    band = str(prop.get("band", "none")).lower()
    if band not in ("stretch", "realistic", "floor"):
        return no_change
    try:
        current = int(bands.get(band))
        wanted = int(prop.get("to"))
    except (TypeError, ValueError):
        return no_change
    if wanted == current:
        return no_change

    if band == "floor":
        if logs.count("N") < 3:
            return no_change
        to = current - 1
        if to < 1:
            return no_change
    else:
        step = max(1, round(current * STEP_FRACTION))
        to = max(current - step, min(current + step, wanted))
        if to < 1 or to == current:
            return no_change

    new = {k: int(bands.get(k) or 0) for k in ("stretch", "realistic", "floor")}
    new[band] = to
    if not (1 <= new["floor"] < new["realistic"] < new["stretch"]):
        return no_change

    out = dict(prop)
    out.update({"band": band, "from": current, "to": to})
    return out


@router.get("/overview/{goal_id}")
def week_overview(goal_id: int):
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM goals WHERE id = ?", (goal_id,))
    goal = cur.fetchone()
    goal_dict = dict(goal) if goal else {}
    cur.execute("SELECT COUNT(DISTINCT date) AS cnt FROM logs WHERE goal_id = ?", (goal_id,))
    count = cur.fetchone()['cnt'] or 0
    logs_last7 = _last7(cur, goal_id)
    conn.close()

    age_days = None
    try:
        created = goal_dict.get('created_at')
        if created:
            age_days = (date.today() - date.fromisoformat(str(created)[:10])).days
    except Exception:
        age_days = None
    last7_just_starting = (age_days if age_days is not None else count) < JUST_STARTING_DAYS

    return {
        "unlocked": count >= WEEK_UNLOCK_NIGHTS,
        "nights_logged": count,
        "nights_needed": WEEK_UNLOCK_NIGHTS,
        "last7_just_starting": last7_just_starting,
        "last7_message": LAST7_JUST_STARTING_MESSAGE if last7_just_starting else None,
        "logs": logs_last7,
    }


@router.post("/start/{goal_id}")
def week_start(goal_id: int):
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(DISTINCT date) AS cnt FROM logs WHERE goal_id = ?", (goal_id,))
    if (cur.fetchone()['cnt'] or 0) < WEEK_UNLOCK_NIGHTS:
        conn.close()
        raise HTTPException(status_code=409, detail={"message": "Log a few more nights first."})
    cur.execute("SELECT * FROM goals WHERE id = ?", (goal_id,))
    goal = cur.fetchone()
    goal_dict = dict(goal) if goal else {}
    bands_dict = _latest_bands(cur, goal_id)
    logs_last7 = _last7(cur, goal_id)
    try:
        from pydantic import BaseModel as BM

        class Q(BM):
            id: str
            text: str

        class Qs(BM):
            questions: list[Q]

        system = prompts.SYSTEM_PROMPT.format(context="You generate week evaluation questions.")
        user = prompts.WEEK_QUESTIONS_PROMPT.format(
            name=goal_dict.get('name', ''), category=goal_dict.get('category', 'general'),
            logs_json=json.dumps(logs_last7), bands_json=json.dumps(bands_dict))
        questions = []
        for _ in range(2):
            res = ai_client.ai_client.generate_json(system, user, Qs)
            questions = [q.model_dump() for q in res.questions][:3]
            if len(questions) == 3 and len({q['id'] for q in questions}) == 3:
                break
        if len(questions) != 3:
            raise ValueError(f"AI returned {len(questions)} questions, need exactly 3")
    except Exception:
        log.warning("week/start failed", exc_info=True)
        conn.close()
        raise HTTPException(status_code=503, detail={"fallback": True, "message": "Kael is silent for a moment. Try again."})
    week_start_date = (date.today() - timedelta(days=6)).isoformat()
    cur.execute("INSERT INTO week_checkins (goal_id, week_start, logs_snapshot, questions_json, status) VALUES (?,?,?,?,?)",
                (goal_id, week_start_date, json.dumps(logs_last7), json.dumps(questions), 'started'))
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
    valid_ids = {q.get('id') for q in json.loads(wc.get('questions_json') or '[]')}
    if a.question_id not in valid_ids:
        conn.close()
        raise HTTPException(status_code=400, detail="unknown question")
    answers = json.loads(wc.get('answers_json') or '[]')
    answers = [x for x in answers if x.get('question_id') != a.question_id]
    answers.append({"question_id": a.question_id, "answer": a.answer.strip()})
    cur.execute("UPDATE week_checkins SET answers_json = ? WHERE id = ?", (json.dumps(answers), a.checkin_id))
    conn.commit()
    conn.close()
    return {"ok": True, "answered": len(answers)}


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
    answered_ids = {a.get('question_id') for a in answers if str(a.get('answer', '')).strip()}
    # The proposal is only made once EVERY question has an answer.
    if not questions or any(q.get('id') not in answered_ids for q in questions):
        conn.close()
        raise HTTPException(status_code=409, detail="Answer all three questions first.")
    goal_id = wc['goal_id']
    cur.execute("SELECT * FROM goals WHERE id = ?", (goal_id,))
    goal = cur.fetchone()
    goal_dict = dict(goal) if goal else {}
    bands_dict = _latest_bands(cur, goal_id)
    logs_last7 = json.loads(wc.get('logs_snapshot') or '[]')
    cur.execute("SELECT * FROM rank_history WHERE goal_id = ? ORDER BY id DESC LIMIT 10", (goal_id,))
    rh = [dict(r) for r in cur.fetchall()]
    conn.close()
    try:
        from pydantic import BaseModel as BM

        class Prop(BM):
            band: str
            from_value: int
            to: int
            reason: str
            evidence_text: str

        class PropResp(BM):
            proposal: Prop

        system = prompts.SYSTEM_PROMPT.format(context="You propose week band changes for Ember.")
        user = prompts.WEEK_PROPOSE_PROMPT.format(
            name=goal_dict.get('name', ''), logs_json=json.dumps(logs_last7), bands_json=json.dumps(bands_dict),
            rank_history_json=json.dumps(rh), answers_json=json.dumps(answers))
        res = ai_client.ai_client.generate_json(system, user, PropResp)
        raw = res.proposal.model_dump()
        prop = sanitize_proposal(raw, bands_dict, logs_last7)
        conn = db.get_conn()
        cur = conn.cursor()
        cur.execute("UPDATE week_checkins SET proposal = ? WHERE id = ?", (json.dumps(prop), checkin_id))
        conn.commit()
        conn.close()
        return {"proposal": prop}
    except Exception:
        log.warning("week/propose failed", exc_info=True)
        raise HTTPException(status_code=503, detail={"fallback": True, "message": "Kael is silent for a moment. Try again."})


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
    if wc.get('accepted_at'):
        conn.close()
        return {"ok": True, "badge": "Honest Week", "already": True}
    if not r.accept:
        conn.close()
        return {"ok": True}
    goal_id = wc['goal_id']
    prop = json.loads(wc.get('proposal') or '{}')
    snapshot = json.loads(wc.get('logs_snapshot') or '[]')
    current = _latest_bands(cur, goal_id)
    # Re-check the rules against the bands as they are now.
    prop = sanitize_proposal(prop, current, snapshot) if prop else {"band": "none"}
    if prop.get('band') in ('stretch', 'realistic', 'floor') and prop.get('to') is not None and current:
        new = dict(current)
        new.pop('id', None)                      # keep unit, descriptions and reasons; only the amount changes
        new[prop['band']] = int(prop['to'])
        new['updated_at'] = datetime.now().isoformat()
        cols = list(new.keys())
        cur.execute(f"INSERT INTO bands ({', '.join(cols)}) VALUES ({', '.join('?' * len(cols))})", [new[c] for c in cols])
        cur.execute("INSERT INTO rank_history (goal_id, date, change, reason) VALUES (?,?,?,?)",
                    (goal_id, date.today().isoformat(), 0, prop.get('evidence_text') or prop.get('reason') or ''))
    cur.execute("UPDATE week_checkins SET accepted_at = ? WHERE id = ?", (datetime.now().isoformat(), r.checkin_id))
    conn.commit()
    conn.close()
    return {"ok": True, "badge": "Honest Week"}
