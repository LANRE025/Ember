from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import db
from app.services import ai_service
from app.api import goals, setup

router = APIRouter()

class CreateGoal(BaseModel):
    name: str
    why: str

class InterviewAnswer(BaseModel):
    goal_id: int
    answers: list[str]

@router.post("/start")
def start_goal(g: CreateGoal):
    goal_id = db.create_goal(g.name, g.why)
    db.init_rank(goal_id)
    return {"goal_id": goal_id}

@router.get("/status")
def status():
    goal = db.get_goal()
    if not goal:
        return {"has_goal": False}
    bands = db.get_bands(goal['id'])
    rank = db.get_rank(goal['id'])
    return {"has_goal": True, "goal": goal, "bands": bands, "rank": rank}
