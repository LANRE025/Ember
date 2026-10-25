import os, httpx
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
r = httpx.get("https://api.groq.com/openai/v1/models",
              headers={"Authorization": f"Bearer {os.getenv('GROQ_API_KEY','').strip()}"}, timeout=20)
for m in sorted(x["id"] for x in r.json().get("data", [])):
    print(m)