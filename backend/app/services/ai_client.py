import os
from typing import Any, Dict, Optional, Type, TypeVar
import json

try:
    from google import genai
    from google.genai import types
except Exception:
    genai = None
    types = None

from pydantic import BaseModel, ValidationError

from app.services import prompts
from app.core.config import settings

T = TypeVar('T', bound=BaseModel)


class AIUnavailable(Exception):
    pass


class AIClient:
    def __init__(self):
        self.project = settings.GOOGLE_CLOUD_PROJECT or os.getenv('GOOGLE_CLOUD_PROJECT') or ''
        self.location = settings.GOOGLE_CLOUD_LOCATION or os.getenv('GOOGLE_CLOUD_LOCATION') or 'global'
        self.model = settings.GEMINI_MODEL or os.getenv('GEMINI_MODEL') or 'gemini-3.8-flash'
        mf = settings.GEMINI_MODEL_FAST or os.getenv('GEMINI_MODEL_FAST')
        self.model_fast = mf or self.model
        self.client = None
        if genai and self.project:
            try:
                self.client = genai.Client(vertexai=True, project=self.project, location=self.location)
            except Exception:
                self.client = None

    def _ensure(self):
        if not genai or not self.project:
            raise AIUnavailable("AI not configured")
        if not self.client:
            self.client = genai.Client(vertexai=True, project=self.project, location=self.location)

    def generate_json(self, system: str, user: str, schema: Type[T], model_name: Optional[str] = None, timeout_ms: int = 20000) -> T:
        self._ensure()
        model_name = model_name or self.model
        last_err = None
        for attempt in range(2):
            try:
                config = types.GenerateContentConfig(
                    system_instruction=system,
                    response_mime_type="application/json",
                    response_schema=schema,
                    temperature=0.4,
                    max_output_tokens=2048,
                )
                resp = self.client.models.generate_content(model=model_name, contents=user, config=config)
                text = getattr(resp, 'text', None)
                if not text:
                    try:
                        if getattr(resp, 'candidates', None):
                            text = resp.candidates[0].content.parts[0].text
                    except Exception:
                        text = None
                if not text or not str(text).strip():
                    raise AIUnavailable("empty response")
                text = str(text).strip()
                if '{' in text and not text.strip().startswith('{'):
                    start = text.index('{')
                    end = text.rindex('}') + 1
                    text = text[start:end]
                data = json.loads(text)
                try:
                    return schema.model_validate(data)
                except Exception:
                    try:
                        return schema.parse_obj(data)
                    except Exception:
                        pass
            except ValidationError as e:
                last_err = e
                continue
            except AIUnavailable as e:
                last_err = e
                continue
            except Exception as e:
                last_err = e
                continue
        raise AIUnavailable(str(last_err) if last_err else "AI error")

    def generate_text(self, system: str, history: list, user: str, model_name: Optional[str] = None, timeout_ms: int = 20000) -> str:
        self._ensure()
        model_name = model_name or self.model_fast or self.model
        try:
            contents = []
            for h in history[-12:]:
                role = 'user' if h.get('role') == 'user' else 'model'
                contents.append(types.Content(role=role, parts=[types.Part(text=h.get('text', ''))]))
            contents.append(types.Content(role='user', parts=[types.Part(text=user)]))
            config = types.GenerateContentConfig(
                system_instruction=system,
                temperature=0.8,
                max_output_tokens=512,
            )
            resp = self.client.models.generate_content(model=model_name, contents=contents, config=config)
            text = getattr(resp, 'text', None)
            if not text:
                try:
                    if getattr(resp, 'candidates', None):
                        text = resp.candidates[0].content.parts[0].text
                except Exception:
                    text = None
            if not text or not str(text).strip():
                raise AIUnavailable("empty response")
            return str(text).strip()
        except AIUnavailable:
            raise
        except Exception as e:
            raise AIUnavailable(str(e))

    def health_check(self):
        try:
            p = os.environ.get('GOOGLE_CLOUD_PROJECT') or self.project
            l = os.environ.get('GOOGLE_CLOUD_LOCATION') or self.location or 'global'
            m = os.environ.get('GEMINI_MODEL') or self.model or 'gemini-3.8-flash'
            self.project = p
            self.location = l
            self.model = m
            if not genai or not p:
                return {"provider": "vertex", "location": l, "model": m, "reachable": False, "hint": "not configured"}
            try:
                self.client = genai.Client(vertexai=True, project=p, location=l)
            except Exception as e:
                return {"provider": "vertex", "location": l, "model": m, "reachable": False, "hint": str(e)[:80]}
            try:
                resp = self.client.models.generate_content(model=m, contents="say ok", config=types.GenerateContentConfig(max_output_tokens=64, temperature=0))
            except Exception as e:
                return {"provider": "vertex", "location": l, "model": m, "reachable": False, "hint": str(e)[:80]}
            text = getattr(resp, 'text', None)
            if not text:
                try:
                    if getattr(resp, 'candidates', None):
                        text = resp.candidates[0].content.parts[0].text
                except Exception:
                    text = None
            if not text or not str(text).strip():
                return {"provider": "vertex", "location": l, "model": m, "reachable": False, "hint": "empty response (thinking tokens or limits)"}
            return {"provider": "vertex", "location": l, "model": m, "reachable": True}
        except Exception as e:
            return {"provider": "vertex", "location": os.environ.get('GOOGLE_CLOUD_LOCATION','global'), "model": os.environ.get('GEMINI_MODEL','gemini-3.8-flash'), "reachable": False, "hint": str(e)[:80]}


ai_client = AIClient()
