from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import db
from app.services import ai_client
from app.services import prompts
import json

router = APIRouter()

class CreateGoal(BaseModel):
    name: str
    why: str

class InterviewAnswerItem(BaseModel):
    question_id: str
    answer: str

class InterviewSubmit(BaseModel):
    goal_id: int
    answers: list[InterviewAnswerItem]

@router.post("/start")
def start_goal(g: CreateGoal):
    goal_id = db.create_goal(g.name, g.why)
    db.init_rank(goal_id)
    # classify and generate questions
    try:
        from pydantic import BaseModel as BM
        class Classify(BM):
            category: str
            unit: str
            practice_meaning: str
        class Q(BM):
            id: str
            text: str
            hint: str | None = None
        class Qs(BM):
            questions: list[Q]
        system = prompts.SYSTEM_PROMPT.format(context="You classify goals and generate interview questions for Ember.")
        user = prompts.BAND_CLASSIFY_PROMPT.format(name=g.name, why=g.why)
        cls = ai_client.ai_client._call_json(Classify, system, user)
        conn = db.get_conn()
        cur = conn.cursor()
        cur.execute("UPDATE goals SET category=?, unit=?, profile_json=? WHERE id=?", (cls.category, cls.unit, json.dumps(cls.model_dump() if hasattr(cls,'model_dump') else cls.dict()), goal_id))
        conn.commit()
        conn.close()
        user2 = prompts.INTERVIEW_GENERATE_PROMPT.format(category=cls.category, unit=cls.unit, practice_meaning=cls.practice_meaning, name=g.name, why=g.why)
        qs = ai_client.ai_client._call_json(Qs, system, user2)
        # persist
        conn = db.get_conn()
        cur = conn.cursor()
        for idx, q in enumerate(qs.questions):
            cur.execute("INSERT INTO interview (goal_id, idx, question_id, question) VALUES (?,?,?,?)", (goal_id, idx, q.id, q.text))
        conn.commit()
        conn.close()
        return {"goal_id": goal_id, "questions": [q.model_dump() if hasattr(q,'model_dump') else q.dict() for q in qs.questions]}
    except Exception:
        # fallback questions
        questions = [
            {"id": "q1", "text": "How much time can you realistically spare on a tired evening?"},
            {"id": "q2", "text": "What's the smallest version you'd still do when unmotivated?"},
            {"id": "q3", "text": "What tends to get in the way most often?"},
            {"id": "q4", "text": "Honest energy last week - how many evenings had real energy?"},
            {"id": "q5", "text": "What happened to your last big plan?"},
            {"id": "q6", "text": "What do you tell yourself when you skip?"},
            {"id": "q7", "text": "What competes for time in the evenings?"},
            {"id": "q8", "text": "What's a 'just show up' version for this goal?"},
        ]
        conn = db.get_conn()
        cur = conn.cursor()
        for idx, q in enumerate(questions):
            cur.execute("INSERT INTO interview (goal_id, idx, question_id, question) VALUES (?,?,?,?)", (goal_id, idx, q['id'], q['text']))
        conn.commit()
        conn.close()
        return {"goal_id": goal_id, "questions": questions}

@router.get("/interview/{goal_id}")
def get_interview(goal_id: int):
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT question_id, question FROM interview WHERE goal_id = ? ORDER BY idx", (goal_id,))
    rows = cur.fetchall()
    conn.close()
    if rows:
        return {"questions": [{"id": r['question_id'], "text": r['question']} for r in rows]}
    return {"questions": [
        {"id": "q1", "text": "How much time can you realistically spare on a tired evening?"},
        {"id": "q2", "text": "What's the smallest version you'd still do when unmotivated?"},
        {"id": "q3", "text": "What tends to get in the way most often?"},
    ]}

@router.post("/interview")
def submit_interview(a: InterviewSubmit):
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM goals WHERE id = ?", (a.goal_id,))
    goal = cur.fetchone()
    goal_dict = dict(goal) if goal else {"name": "", "why": "", "category": "general", "unit": "minutes"}
    # save answers
    for item in a.answers:
        cur.execute("UPDATE interview SET answer = ? WHERE goal_id = ? AND question_id = ?", (item.answer, a.goal_id, item.question_id))
    conn.commit()
    # load all answers
    cur.execute("SELECT question_id, question, answer FROM interview WHERE goal_id = ? ORDER BY idx", (a.goal_id,))
    ans_rows = cur.fetchall()
    conn.close()
    answers_json = json.dumps([{"question_id": r['question_id'], "question": r['question'], "answer": r['answer']} for r in ans_rows])
    try:
        from pydantic import BaseModel as BM
        class BandItem(BM):
            amount: int
            unit: str
            description: str
            reason: str
        class BandsResp(BM):
            bands: dict
        system = prompts.SYSTEM_PROMPT.format(context="You suggest bands for Ember. Follow all rules strictly.")
        user = prompts.BANDS_SUGGEST_PROMPT.format(category=goal_dict.get('category','general'), unit=goal_dict.get('unit','minutes'), name=goal_dict.get('name',''), why=goal_dict.get('why',''), answers_json=answers_json)
        res = ai_client.ai_client._call_json(BandsResp, system, user)
        b = res.bands
        stretch = b['stretch']
        realistic = b['realistic']
        floor = b['floor']
        s_amt = int(stretch['amount']); r_amt = int(realistic['amount']); f_amt = int(floor['amount'])
        unit = stretch.get('unit') or goal_dict.get('unit','minutes')
        # validate
        if not (f_amt >= 1 and f_amt < r_amt < s_amt and f_amt <= r_amt * 0.5 and s_amt <= r_amt * 3):
            raise Exception("invalid")
        conn = db.get_conn()
        cur = conn.cursor()
        cur.execute("INSERT INTO bands (goal_id, stretch, realistic, floor, updated_at, unit, stretch_desc, realistic_desc, floor_desc, stretch_reason, realistic_reason, floor_reason) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                    (a.goal_id, s_amt, r_amt, f_amt, __import__('datetime').datetime.now().isoformat(), unit, stretch.get('description',''), realistic.get('description',''), floor.get('description',''), stretch.get('reason',''), realistic.get('reason',''), floor.get('reason','')))
        conn.commit()
        conn.close()
        return {"bands": {"stretch": s_amt, "realistic": r_amt, "floor": f_amt}, "descriptions": {"stretch": stretch.get('description',''), "realistic": realistic.get('description',''), "floor": floor.get('description','')}, "reasons": {"stretch": stretch.get('reason',''), "realistic": realistic.get('reason',''), "floor": floor.get('reason','')}, "unit": unit, "ai": True}
    except Exception:
        raise HTTPException(status_code=503, detail={"fallback": True, "message": "AI unavailable. Use manual setup."})

@router.get("/status")
def status():
    goal = db.get_goal()
    if not goal:
        return {"has_goal": False}
    bands = db.get_bands(goal['id'])
    if not bands:
        db.update_bands(goal['id'], 5, 3, 1)
        bands = db.get_bands(goal['id'])
    rank = db.get_rank(goal['id'])
    if not rank:
        db.init_rank(goal['id'])
        rank = db.get_rank(goal['id'])
    # check interview done
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as cnt FROM interview WHERE goal_id = ? AND answer IS NOT NULL AND answer != ''", (goal['id'],))
    done = cur.fetchone()['cnt'] or 0
    cur.execute("SELECT COUNT(*) as cnt FROM interview WHERE goal_id = ?", (goal['id'],))
    total = cur.fetchone()['cnt'] or 0
    conn.close()
    return {"has_goal": True, "goal": goal, "bands": bands, "rank": rank, "unit": bands.get('unit'), "descriptions": {"stretch": bands.get('stretch_desc'), "realistic": bands.get('realistic_desc'), "floor": bands.get('floor_desc')}, "reasons": {"stretch": bands.get('stretch_reason'), "realistic": bands.get('realistic_reason'), "floor": bands.get('floor_reason')}, "interview_done": done >= total and total > 0, "category": goal.get('category')}

@router.get("/status")
def status():
    goal = db.get_goal()
    if not goal:
        return {"has_goal": False}
    bands = db.get_bands(goal['id'])
    if not bands:
        db.update_bands(goal['id'], 5, 3, 1)
        bands = db.get_bands(goal['id'])
    rank = db.get_rank(goal['id'])
    if not rank:
        db.init_rank(goal['id'])
        rank = db.get_rank(goal['id'])
    return {"has_goal": True, "goal": goal, "bands": bands, "rank": rank}
