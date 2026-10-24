from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import logs, rank, ai, week, setup, goals

app = FastAPI(title="Ember API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(setup.router, prefix="/setup", tags=["setup"])
app.include_router(goals.router, prefix="/goals", tags=["goals"])
app.include_router(logs.router, prefix="/logs", tags=["logs"])
app.include_router(rank.router, prefix="/rank", tags=["rank"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(week.router, prefix="/week", tags=["week"])

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "Ember API"}
