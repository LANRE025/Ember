# Ember Backend

FastAPI + SQLite backend for **Ember**, a calibrated evening planner. It stores goals, bands (Stretch / Realistic / Floor), nightly logs, rank and badges, and calls an AI model to tailor setup, generate tonight's quests, run the weekly evaluation, and power the "Consult Kael" chat.

The AI provider is **pluggable**. You can run on a free Groq key, on Google Vertex AI (Gemini), or with no AI at all.

---

## Requirements

- Python 3.11 or newer
- One of: a free Groq API key, a Google Cloud project with Vertex AI, or nothing (offline mode)

---

## 1. Install

**Windows (PowerShell)**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install -r requirements.txt
```

**macOS / Linux**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Then create your config file:

```bash
# Windows:  copy .env.example .env
# macOS/Linux:
cp .env.example .env
```

`backend/.env` is ignored by git. Never commit it.

---

## 2. Choose an AI provider

Set `AI_PROVIDER` explicitly in `backend/.env`. Only the provider you select is used, so you do not need to clear the other provider's variables.

| `AI_PROVIDER` | Behaviour |
|---|---|
| `groq` | Always use Groq. |
| `vertex` | Always use Vertex AI (Gemini). |
| `none` | AI disabled (offline mode). |
| `auto` | Groq if `GROQ_API_KEY` and `GROQ_MODEL` are both set, otherwise Vertex if `GOOGLE_CLOUD_PROJECT` is set, otherwise offline. |

### Option A: Groq (free key, no billing)

1. Create a free key in the [Groq Console](https://console.groq.com/keys).
2. Set in `backend/.env`:

```
AI_PROVIDER=groq
GROQ_API_KEY=your_key
GROQ_MODEL=openai/gpt-oss-120b
```

Notes:
- The models your key can call depend on your Groq account. List them with `python list_groq.py` and use any text model from that list as `GROQ_MODEL`.
- `openai/gpt-oss-*` models are reasoning models. The backend sends `reasoning_effort` and a generous token budget so replies are not cut off.
- Check a key and model outside the app with `python check_groq.py`.

### Option B: Vertex AI (Gemini)

1. Install the Google Cloud CLI and sign in for Application Default Credentials:
   ```
   gcloud auth application-default login
   ```
2. Pick or create a project, enable the API and billing:
   ```
   gcloud config set project YOUR_PROJECT_ID
   gcloud services enable aiplatform.googleapis.com
   ```
   The signed-in account needs the `roles/aiplatform.user` role.
3. Set in `backend/.env`:

```
AI_PROVIDER=vertex
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=global
GOOGLE_GENAI_USE_VERTEXAI=true
GEMINI_MODEL=gemini-3.8-flash
GEMINI_MODEL_FAST=gemini-3.8-flash
```

Notes:
- Use `YOUR_PROJECT_ID` exactly as `gcloud projects list` prints it (the id, not the display name).
- `GOOGLE_CLOUD_LOCATION=global` is required for `gemini-3.8-flash`. A regional location such as `us-central1` returns 404 for this model.
- Test the connection outside the app with `python scripts/check_ai.py`.

### Option C: No key (offline mode)

```
AI_PROVIDER=none
```

The app still runs. AI routes return a calm `503` with a fallback message (for example "Kael is silent for a moment. Try again."), and the rest of the loop (logging, rank, badges) keeps working.

### Optional settings

```
AI_FALLBACK_PROVIDER=none   # groq | vertex | none. Tried if the main provider fails
AI_TIMEOUT_SECONDS=20
DB_PATH=./ember.db
PORT=8082
```

---

## 3. Run

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8082
```

Add `--reload` during development. Restart the server after every `.env` change.

- API docs (Swagger): http://127.0.0.1:8082/docs
- Provider status: http://127.0.0.1:8082/ai/health

A healthy Groq or Vertex setup looks like:

```json
{ "provider": "groq", "auto_resolved": "groq", "configured": true, "model": "openai/gpt-oss-120b", "reachable": true }
```

The SQLite database is created automatically on first start (`DB_PATH`, default `./ember.db`).

### Connect the frontend

The frontend reads the API address from `frontend/.env`:

```
VITE_API_BASE_URL=http://127.0.0.1:8082
```

Restart `npm run dev` after changing it.

---

## 4. API overview

Full, interactive reference at `/docs`. Main routes:

| Method | Path | Purpose |
|---|---|---|
| POST | `/setup/start` | Create a goal (`name`, `why`). The AI classifies it and returns tailored interview questions. |
| GET | `/setup/interview/{goal_id}` | Fetch a goal's interview questions. |
| POST | `/setup/interview` | Submit all answers. The AI sets the Stretch / Realistic / Floor bands. |
| GET | `/setup/status` | Current goal, bands, rank and interview progress. |
| POST | `/ai/shutdown` | Typed brain dump in, exactly 3 quests for tomorrow out. |
| GET | `/ai/quests/{goal_id}` | Today's saved quests. |
| POST | `/ai/chat` | Consult Kael: send a message, get Kael's reply. |
| GET | `/ai/chat/{goal_id}` | Chat history. |
| GET | `/ai/health` | Active provider, model and reachability. |
| POST | `/logs/log` | Log a night (Stretch / Realistic / Floor / Nothing). |
| POST | `/rank/update/{goal_id}` | Recalculate rank. |
| POST | `/week/check/{goal_id}` | Weekly evaluation. |
| POST | `/goals/raise` | Raise Stretch or Realistic by one step. |

Product rules enforced by the backend:
- The Floor is never zero and the user cannot lower it. Only Ember's weekly proposal can change it, by one step.
- The AI may change only one band per proposal, by one step.
- Tonight's brain dump always yields exactly 3 quests, one of them Floor-sized.

---

## 5. Troubleshooting

Every AI route fails calmly with a `503` and a friendly message. The real reason is printed in the server console as a `WARNING`.

| Symptom | Likely cause and fix |
|---|---|
| `/ai/health` shows `"hint": "not configured"` | `.env` is not being loaded. Check that it is named `.env`, sits in `backend/`, is saved as UTF-8 (no BOM), and that you restarted the server. |
| `"hint": "check GROQ_API_KEY"` | Key missing or wrong, or `GROQ_MODEL` is empty. No quotes or spaces around the values. |
| `"hint": "model id not available"` (Groq) | Your account cannot use that model. Run `python list_groq.py` and pick one from the list. |
| `"hint": "location global and a valid model id"` (Vertex) | Set `GOOGLE_CLOUD_LOCATION=global` and use a valid Gemini model id. |
| `"hint": "enable aiplatform.googleapis.com and billing"` (Vertex) | Enable the API and billing on the project, and give your account `roles/aiplatform.user`. |
| `"hint": "rate limit"` | Free-tier limit hit. Wait a minute and retry. |
| Generic interview questions every time | The AI call failed and the built-in defaults were used. Read the `setup/start fell back` warning in the console. |
| `AI disabled` in logs | `AI_PROVIDER` is `none`, or `auto` found no usable key or project. Set `AI_PROVIDER` explicitly. |
| A real environment variable seems to override `.env` | Environment variables win over `.env`. Clear them in your shell (for example `Remove-Item Env:AI_PROVIDER` in PowerShell) or open a new terminal. |
| `ImportError: cannot import name 'genai'` | Run `python -m pip install -r requirements.txt` inside the virtual environment. |

---

## 6. Project layout

```
backend/
  app/
    main.py            FastAPI app and routers
    api/               setup, goals, logs, rank, ai, week
    services/
      ai_client.py     Groq and Vertex providers, provider selection
      prompts.py       All AI prompts
      db.py            SQLite access and schema
    core/config.py     Settings loaded from .env
  scripts/check_ai.py  Vertex connectivity test
  check_groq.py        Groq key and model test
  list_groq.py         Lists models your Groq key can call
  .env.example
```

---

## License

MIT. See the `LICENSE` file at the repository root.