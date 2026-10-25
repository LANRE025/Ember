---
doc: spec
status: approved
---

# Ember — Technical Spec

## How This Works, In Plain Language

Ember keeps one goal alive by splitting it into bands (Stretch/Realistic/Floor), with the Floor read-only to the person and only Ember able to adjust it. The person can raise Stretch or Realistic by one step, but never lower them. 

At the core:
- **Setup**: The person names their goal and why, answers an interview, and gets bands assigned. The AI (gemini-3.8-flash on Vertex AI) can help with banding, but if it fails, the person sets Stretch/Realistic while Ember assigns the Floor.
- **Daily loop**: Each evening, they do an "evening shutdown" (brain dump) to get tomorrow's top 3 quests. They log the day (Stretch/Realistic/Floor/Nothing). Unlogged days count as Nothing for rank penalties.
- **Weekly check-in**: After 3 nights logged, Ember reviews evidence and may propose a one-step band change (or Floor change if necessary, never to zero). Honest Week fires live on the seeded check-in.
- **Ranks**: Active with a penalty — 2 consecutive Nothing days or unlogged days count as Nothing and lower rank by one (never below Spark). To rank up: 3 consecutive days of at least a Realistic run gives +2, 3 consecutive days of at least a Floor run gives +1. Ranks go Spark → Kindle → Flame → Blaze → Inferno.
- **Coach**: **Kael** (Sensei) appears on Today, Tonight, and Week screens on the leftmost part of the page. He's a knight in folded-arm pose with a conspicuous sword, shown from head-to-waist using the exact image `Gemini_Generated_Image_owkwf4owkwf4owkw.jpg` (no cropping, scale as needed).
- **Storage**: A Python FastAPI server with SQLite (ephemeral on Cloud Run for the PoC). All state persists in SQLite while the instance is alive, but will reset on restart/redeploy.
- **UI**: React web app with deep navy blue as primary, windows/icons in deep navy/purple/red only for negative alerts, with a 3D feel. No flashy motion.

The shape is deliberately simple: API server + mobile app, both talking over HTTP. Everything is sized to prove the core loop without extra services.

## The Core Journey Through the System

Implements `prd.md > The Core Journey`.

1. **First open** → React web app loads, calls FastAPI `/setup/status`. No goal → shows first-run screen. User enters goal + why.
2. **Interview + band reveal** → FastAPI calls Gemini Pro to help suggest bands based on answers. If AI fails, fallback to manual S/R + system-assigned Floor. Bands saved to SQLite.
3. **Today** → App loads goal/bands/rank/logs. **Kael** renders on leftmost edge (full head-to-waist image, scaled). User can raise S/R by 1 step (Floor locked). Can log the day or go to Tonight.
4. **Tonight** → Brain dump sent to FastAPI, Gemini Pro generates top 3 quests with tiny first steps. Returns to app, saved as today's quests.
5. **Log** → User taps S/R/F/Nothing. FastAPI updates logs, recalculates consecutive streaks, applies rank penalty/up logic. Unlogged days are treated as Nothing.
6. **Week check-in** (after ≥3 nights) → FastAPI analyzes logs, may propose band changes (or Floor change if necessary, never to zero). User accepts/rejects. Honest Week fires live on seeded check-in.
7. **Refusal** → If user tries to lower/zero Floor or lower bands, API blocks and explains. If "raise everything", allows +1 to S/R, holds Floor. Awards Held the Line.
8. **Reminder preview** → User can trigger reminder modal showing their why words + "Do the floor and it still counts" + Start floor button.

## Stack

| Component | Technology | Version/Notes | Docs |
|-----------|------------|---------------|------|
| Backend | **Python + FastAPI** | Latest stable | [FastAPI Docs](https://fastapi.tiangolo.com/) |
| Frontend | **React Web (Vite/React)** | Latest | [React Docs](https://react.dev/) |
| Database | **SQLite** | Built-in, ephemeral on Cloud Run | [SQLite Docs](https://www.sqlite.org/docs.html) |
| AI | **Google Gemini** | gemini-3.8-flash on Vertex AI, location global, ADC auth, no API keys | [Google Vertex AI Docs](https://cloud.google.com/vertex-ai/docs) |
| Deployment | **Google Cloud Run** | Containerized | [Cloud Run Docs](https://cloud.google.com/run/docs) |
| HTTP Client | **axios** (web) | Standard | [Axios Docs](https://axios-http.com/) |

**Rationale**: FastAPI is clean for API routes and easy to containerize for Cloud Run. React web app is easy to run for recording the demo video. SQLite keeps it simple for the PoC with ephemeral storage accepted. Gemini Pro provides the AI features requested.

## Where It Runs and How Someone Tries It

**Runtime**: 
- **Backend**: Containerized Python app on Google Cloud Run (listens on `$PORT`)
- **Frontend**: React web app (run locally for demo recording)

**Environment requirements**:
- `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION=global`, `GEMINI_MODEL=gemini-3.8-flash` (ADC auth, no API keys)
- `API_BASE_URL` (env var for web app pointing to Cloud Run backend)
- `PORT` (set by Cloud Run)

**Start commands**:
1. **Backend locally**: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8080`
2. **Frontend**: `cd frontend && npm install && npm run dev`
3. **Deploy to Cloud Run**: Build container from `backend/Dockerfile` and deploy with env vars

**Demo**: Run the web app, point to the Cloud Run API (or local), walk through the flow. Record a short demo video. Push code to public GitHub repo. Deployment to Cloud Run is required as specified.

## Look and Feel

Implements `prd.md > Look and Feel`.

- **Palette**: Deep navy blue (`#050a14`, `#03080f`) as primary. Windows/icons use **deep navy blue**, **purple**, or **red** only for negative alerts. High contrast for late-night readability.
- **3D feel**: Icons and windows have beveled edges, inner shadows, inset bevels, and subtle depth. Weight over glow.
- **Motion**: Short fade-ins as windows appear. Calm and deliberate, not flashy.
- **Tone**: Gentle consequences, no shaming copy.
- **Kael (Virtual Coach)**: Anime knight in Solo Leveling/Black Clover style. Head-to-waist, folded-arm pose with a conspicuous sword. Uses `devpost/assets/Gemini_Generated_Image_owkwf4owkwf4owkw.jpg` exactly as-is (no cropping). Positioned on the **leftmost part of the page**, visible on Today, Tonight, and Week screens. Scale as necessary to fit without obscuring critical UI elements.

## Components

### Backend Components

#### `app/main.py` - FastAPI app entry
- CORS setup, route registration
- PRD ref: `prd.md > The Core Journey`

#### `app/api/setup.py` - First run & interview
- Goal creation, interview, band suggestion via Gemini
- PRD ref: `prd.md > First-run setup`

#### `app/api/goals.py` - Goals & bands
- CRUD for goals/bands, enforce Floor read-only, allow S/R +1 only
- PRD ref: `prd.md > Bands and the Floor`

#### `app/api/logs.py` - Nightly logging
- Log S/R/F/Nothing, track consecutive days, count unlogged as Nothing
- PRD ref: `prd.md > Nightly log`

#### `app/api/week.py` - Weekly check-in
- Unlock at ≥3 nights, analyze evidence, propose changes
- PRD ref: `prd.md > Week (weekly check-in)`

#### `app/api/rank.py` - Rank system
- Penalty (-1 on 2 consecutive Nothing/unlogged, never below Spark), up (+2 on 3 consecutive ≥Realistic, +1 on 3 consecutive ≥Floor)
- PRD ref: `prd.md > Ranks and badges`

#### `app/api/ai.py` - Gemini integration
- Band suggestions, shutdown top-3, week analysis with gemini-3.8-flash on Vertex AI (global)
- PRD ref: `prd.md > Tonight (evening shutdown)`

#### `app/services/db.py` - Database layer
- SQLite connection, schema creation, queries
- PRD ref: `prd.md > States and Boundaries`

#### `app/services/rank_calc.py` - Rank logic
- Consecutive tracking, penalty and promotion rules
- PRD ref: `prd.md > Ranks and badges`

### Frontend Components (React Web)

#### `src/screens/FirstRunScreen.tsx`
- Goal/why input, interview flow, band reveal
- PRD ref: `prd.md > First-run setup`

#### `src/screens/TodayScreen.tsx`
- Bands (S/R +1, Floor locked), rank badge, logs, quests, reminder panel, **Kael** overlay (leftmost)
- PRD ref: `prd.md > Today`

#### `src/screens/TonightScreen.tsx`
- Brain dump, plan button, top 3 quests, Quest Complete, **Kael** overlay
- PRD ref: `prd.md > Tonight (evening shutdown)`

#### `src/screens/WeekScreen.tsx`
- Week check-in, evidence, proposal, history, **Kael** overlay
- PRD ref: `prd.md > Week (weekly check-in)`

#### `src/components/Kael.tsx`
- Renders `Gemini_Generated_Image_owkwf4owkwf4owkw.jpg` on leftmost edge, head-to-waist (no crop), scaled as needed
- PRD ref: `prd.md > Look and Feel`

#### `src/components/BandRow.tsx`
- Band display with +1 for S/R, lock for Floor, 3D styling
- PRD ref: `prd.md > Bands and the Floor`

#### `src/components/RankBadge.tsx`
- Current rank display
- PRD ref: `prd.md > Ranks and badges`

#### `src/services/api.ts`
- API client using `API_BASE_URL` from env
- PRD ref: `prd.md > Where It Runs and How Someone Tries It`

## Data Model

SQLite schema (ephemeral):

```sql
goals (id, name, why, created_at)
bands (id, goal_id, stretch, realistic, floor, updated_at)
logs (id, goal_id, date, result) -- S/R/F/N; unlogged treated as N
rank (id, goal_id, current_rank, updated_at)
rank_history (id, goal_id, date, change, reason)
badges (id, goal_id, badge, earned_at)
week_checkins (id, goal_id, week_start, logs_snapshot, proposal, accepted_at)
reminders (id, goal_id, start_time, end_time)
```

## File Structure

```
Ember/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── setup.py
│   │   │   ├── goals.py
│   │   │   ├── logs.py
│   │   │   ├── week.py
│   │   │   ├── rank.py
│   │   │   └── ai.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── constants.py
│   │   ├── models/
│   │   │   └── schemas.py
│   │   └── services/
│   │       ├── db.py
│   │       ├── ai_service.py
│   │       └── rank_calc.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Kael.tsx
│   │   │   ├── BandRow.tsx
│   │   │   ├── RankBadge.tsx
│   │   │   └── LogButtons.tsx
│   │   ├── screens/
│   │   │   ├── FirstRunScreen.tsx
│   │   │   ├── TodayScreen.tsx
│   │   │   ├── TonightScreen.tsx
│   │   │   ├── WeekScreen.tsx
│   │   │   └── StatusScreen.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── styles/
│   │   │   └── theme.css
│   │   └── assets/
│   │       └── kael.jpg
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── devpost/
│   └── assets/
│       └── Gemini_Generated_Image_owkwf4owkwf4owkw.jpg
└── README.md
```

## External Services and Dependencies

| Service | Purpose | Auth | Notes |
|---------|---------|------|-------|
| Google Vertex AI (gemini-3.8-flash) | AI features | `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION=global` (ADC) | Fallback to manual if unavailable |
| Google Cloud Run | Backend hosting | GCP auth | Ephemeral storage |

## Important Failure Modes

- **Gemini down** → Manual setup (S/R set, Floor assigned by system)
- **SQLite issues** → Ephemeral, resets on restart (acceptable for PoC)
- **Unlogged days** → Count as Nothing for rank penalty
- **Rank floor** → Never below Spark

## What Was Simplified and Why

- **Ephemeral SQLite on Cloud Run** — Simple for PoC, data resets acceptable for demo
- **React Native Expo** — Easy to run/emulate for recording
- **Gemini with fallback** — Graceful degradation if AI unavailable

## Decisions and Open Issues

### Decisions Made
- Backend: Python FastAPI
- Frontend: React Native (Expo)
- Storage: SQLite ephemeral on Cloud Run
- AI: gemini-3.8-flash on Vertex AI via env vars, ADC auth, no API keys
- Kael: Use exact `Gemini_Generated_Image_owkwf4owkwf4owkw.jpg`, no crop, head-to-waist, leftmost, scale as needed
- Rank up: +2 on 3 consecutive ≥Realistic, +1 on 3 consecutive ≥Floor
- Rank down: -1 on 2 consecutive Nothing/unlogged, never below Spark
- Deployment: Google Cloud Run

### One Genuine Uncertainty (Clarified)
**API base URL**: Need `API_BASE_URL` env var for Expo app (local vs deployed). Will configure via `app.config.js`/`.env`.

### Open Issues
- **Rank thresholds**: Spark→Kindle→Flame→Blaze→Inferno exact values beyond penalty/up rules
- **Sensei positioning**: Fine-tune vertical position to avoid obscuring UI
- **Cloud Run cold starts**: Acceptable for demo
