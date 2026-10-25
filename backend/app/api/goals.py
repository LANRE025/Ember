from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import db

router = APIRouter()

class RaiseBand(BaseModel):
    goal_id: int
    band: str  # stretch or realistic

@router.post("/raise")
def raise_band(r: RaiseBand):
    if r.band not in ['stretch', 'realistic']:
        raise HTTPException(status_code=400, detail="Can only raise Stretch or Realistic by 1 step")
    bands = db.get_bands(r.goal_id)
    if not bands:
        raise HTTPException(status_code=404, detail="Goal not found")
    if r.band == 'stretch':
        db.update_bands(r.goal_id, bands['stretch'] + 1, bands['realistic'], bands['floor'])
    else:
        db.update_bands(r.goal_id, bands['stretch'], bands['realistic'] + 1, bands['floor'])
    return db.get_bands(r.goal_id)

@router.post("/lower")
def lower_band():
    raise HTTPException(status_code=403, detail={"message": "The Floor is set by Ember, not by you."})

@router.post("/floor/lower")
def floor_lower():
    raise HTTPException(status_code=403, detail={"message": "The Floor is set by Ember, not by you."})
