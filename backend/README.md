# Ember Backend

## Quick Start

### Option A: Groq (free key, no billing)
1. Get a free key from [Groq Console](https://console.groq.com/keys)
2. Copy `backend/.env.example` to `backend/.env` and set:
```
AI_PROVIDER=auto
GROQ_API_KEY=your_key
GROQ_MODEL=your_model_id
```

### Option B: Vertex AI (Gemini)
1. Install and login: `gcloud auth application-default login`
2. Enable `aiplatform.googleapis.com` and billing in your project
3. In `backend/.env`:
```
AI_PROVIDER=auto
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=global
GOOGLE_GENAI_USE_VERTEXAI=true
GEMINI_MODEL=gemini-3.8-flash
```

### Option C: No key (offline mode)
Leave all keys empty. App runs with fallbacks; AI routes return calm 503s and the loop still works.

## Run

**Windows (PowerShell)**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8081
```

**macOS/Linux**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8081
```

Open [http://127.0.0.1:8081/ai/health](http://127.0.0.1:8081/ai/health) to check provider status.
