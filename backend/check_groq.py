import os, httpx
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

key = os.getenv("GROQ_API_KEY", "")
model = os.getenv("GROQ_MODEL", "")
print("key set:", bool(key), "| key length:", len(key), "| model:", repr(model))

r = httpx.post(
    "https://api.groq.com/openai/v1/chat/completions",
    headers={"Authorization": f"Bearer {key.strip()}"},
    json={"model": model.strip(),
          "messages": [{"role": "user", "content": 'Reply with JSON {"ok": true}'}],
          "response_format": {"type": "json_object"},
          "max_tokens": 2000, "reasoning_effort": "low"},
    timeout=20,
)
print(r.status_code)
print(r.text[:500])