from google import genai
from google.genai import types
PROJECT = "ember-512615"
MODEL = "gemini-3.8-flash"
for loc in ("us-central1", "global"):
    try:
        c = genai.Client(vertexai=True, project=PROJECT, location=loc)
        r = c.models.generate_content(model=MODEL, contents="Say OK",
            config=types.GenerateContentConfig(max_output_tokens=10))
        print(loc, "WORKS:", r.text)
    except Exception as e:
        print(loc, "FAILED:", str(e)[:300])