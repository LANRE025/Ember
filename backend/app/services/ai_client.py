import os
import json
import time
from typing import Any, Dict, Optional, Type, TypeVar

from pydantic import BaseModel, ValidationError

from app.services import prompts
from app.core.config import settings
import logging 
log = logging.getLogger("ember.ai")

T = TypeVar('T', bound=BaseModel)


class AIUnavailable(Exception):
    pass


class BaseProvider:
    name = "base"
    def generate_json(self, system: str, user: str, schema: Type[T], model_name: Optional[str] = None, timeout_ms: int = 20000) -> T:
        raise AIUnavailable("not implemented")
    def generate_text(self, system: str, history: list, user: str, model_name: Optional[str] = None, timeout_ms: int = 20000) -> str:
        raise AIUnavailable("not implemented")
    def _call_json(self, schema, system: str, user: str, model_name=None):
        return self.generate_json(system, user, schema, model_name=model_name)
    def health_check(self):
        raise AIUnavailable("not implemented")


class NoneProvider(BaseProvider):
    name = "none"
    def generate_json(self, *a, **k):
        raise AIUnavailable("AI disabled")
    def generate_text(self, *a, **k):
        raise AIUnavailable("AI disabled")
    def _call_json(self, schema, system: str, user: str, model_name=None):
        return self.generate_json(system, user, schema, model_name=model_name)
    def health_check(self):
        return {"provider": "none", "auto_resolved": "none", "configured": False, "model": None, "reachable": False, "hint": "offline mode"}


class GroqProvider(BaseProvider):
    name = "groq"
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY") or ""
        self.model = settings.GROQ_MODEL or os.getenv("GROQ_MODEL") or ""
    def _headers(self):
        return {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
    def generate_json(self, system: str, user: str, schema: Type[T], model_name: Optional[str] = None, timeout_ms: int = 20000) -> T:
        if not self.api_key or not self.model:
            raise AIUnavailable("check GROQ_API_KEY")
        import httpx
        url = "https://api.groq.com/openai/v1/chat/completions"
        shape = json.dumps(schema.model_json_schema())
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": f"{system}\n\nReturn ONLY valid JSON that matches this JSON Schema. No text outside the JSON.\n{shape}"},
                {"role": "user", "content": user},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.4,
            "max_tokens": 4096,
        }
        if "gpt-oss" in self.model:
            payload["reasoning_effort"] = "medium"
        last = None
        for attempt in range(2):
            try:
                r = httpx.post(url, headers=self._headers(), json=payload, timeout=timeout_ms/1000.0)
                if r.status_code == 401:
                    raise AIUnavailable("check GROQ_API_KEY")
                if r.status_code in (400, 404):
                    log.warning("groq %s model=%s body=%s", r.status_code, self.model, r.text[:300])
                    if r.status_code == 400 and attempt == 0:
                        payload.pop("response_format", None)
                        continue
                    raise AIUnavailable("model id not available" if r.status_code == 404 else "bad request")
                if r.status_code == 429 or r.status_code >= 500:
                    if attempt == 0:
                        time.sleep(0.5)
                        continue
                    raise AIUnavailable("rate limit")
                r.raise_for_status()
                data = r.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if not content or not str(content).strip():
                    raise AIUnavailable("empty response")
                text = str(content).strip()
                if '{' in text and not text.strip().startswith('{'):
                    start = text.index('{')
                    end = text.rindex('}') + 1
                    text = text[start:end]
                obj = json.loads(text)
                try:
                    return schema.model_validate(obj)
                except Exception:
                    try:
                        return schema.parse_obj(obj)
                    except Exception:
                        pass
                raise AIUnavailable("invalid json")
            except AIUnavailable:
                raise
            except Exception as e:
                last = e
                if attempt == 0:
                    time.sleep(0.3)
                    continue
                raise AIUnavailable(str(e))
        raise AIUnavailable(str(last))
    def generate_text(self, system: str, history: list, user: str, model_name: Optional[str] = None, timeout_ms: int = 20000) -> str:
        if not self.api_key or not self.model:
            raise AIUnavailable("check GROQ_API_KEY")
        import httpx
        url = "https://api.groq.com/openai/v1/chat/completions"
        messages = [{"role": "system", "content": system}]
        for h in history[-12:]:
            role = "user" if h.get('role') == 'user' else "assistant"
            messages.append({"role": role, "content": h.get('text','')})
        messages.append({"role": "user", "content": user})
        payload = {"model": self.model, "messages": messages, "temperature": 0.8, "max_tokens": 1000}
        if "gpt-oss" in self.model: payload["reasoning_effort"] = "low"
        last = None
        for attempt in range(2):
            try:
                r = httpx.post(url, headers=self._headers(), json=payload, timeout=timeout_ms/1000.0)
                if r.status_code == 401:
                    raise AIUnavailable("check GROQ_API_KEY")
                if r.status_code == 400 or r.status_code == 404:
                    raise AIUnavailable("model id not available")
                if r.status_code == 429 or r.status_code >= 500:
                    if attempt == 0:
                        time.sleep(0.5)
                        continue
                    raise AIUnavailable("rate limit")
                r.raise_for_status()
                data = r.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if not content or not str(content).strip():
                    raise AIUnavailable("empty response")
                return str(content).strip()
            except AIUnavailable:
                raise
            except Exception as e:
                last = e
                if attempt == 0:
                    time.sleep(0.3)
                    continue
                raise AIUnavailable(str(e))
        raise AIUnavailable(str(last))
    def health_check(self):
        try:
            if not self.api_key or not self.model:
                return {"provider": "groq", "auto_resolved": "groq", "configured": False, "model": self.model or None, "reachable": False, "hint": "check GROQ_API_KEY"}
            import httpx
            url = "https://api.groq.com/openai/v1/chat/completions"
            payload = {"model": self.model, "messages": [{"role": "user", "content": "say ok"}], "temperature": 0, "max_tokens": 10}
            r = httpx.post(url, headers=self._headers(), json=payload, timeout=10)
            if r.status_code == 401:
                return {"provider": "groq", "auto_resolved": "groq", "configured": True, "model": self.model, "reachable": False, "hint": "check GROQ_API_KEY"}
            if r.status_code == 429:
                return {"provider": "groq", "auto_resolved": "groq", "configured": True, "model": self.model, "reachable": False, "hint": "rate limit"}
            if r.status_code == 400 or r.status_code == 404:
                return {"provider": "groq", "auto_resolved": "groq", "configured": True, "model": self.model, "reachable": False, "hint": "model id not available"}
            r.raise_for_status()
            data = r.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if not content or not str(content).strip():
                return {"provider": "groq", "auto_resolved": "groq", "configured": True, "model": self.model, "reachable": False, "hint": "empty response"}
            return {"provider": "groq", "auto_resolved": "groq", "configured": True, "model": self.model, "reachable": True}
        except Exception as e:
            return {"provider": "groq", "auto_resolved": "groq", "configured": bool(self.api_key and self.model), "model": self.model or None, "reachable": False, "hint": str(e)[:80]}


class VertexProvider(BaseProvider):
    name = "vertex"
    def __init__(self):
        self.project = settings.GOOGLE_CLOUD_PROJECT or os.getenv("GOOGLE_CLOUD_PROJECT") or ""
        self.location = settings.GOOGLE_CLOUD_LOCATION or os.getenv("GOOGLE_CLOUD_LOCATION") or "global"
        self.model = settings.GEMINI_MODEL or os.getenv("GEMINI_MODEL") or "gemini-3.8-flash"
        self.model_fast = settings.GEMINI_MODEL_FAST or os.getenv("GEMINI_MODEL_FAST") or self.model
        self.client = None
        try:
            from google import genai
            from google.genai import types
            self.genai = genai
            self.types = types
        except Exception:
            self.genai = None
            self.types = None
        if self.genai and self.project:
            try:
                self.client = self.genai.Client(vertexai=True, project=self.project, location=self.location)
            except Exception:
                self.client = None
    def _ensure(self):
        if not self.genai or not self.project:
            raise AIUnavailable("not configured")
        if not self.client:
            self.client = self.genai.Client(vertexai=True, project=self.project, location=self.location)
    def generate_json(self, system: str, user: str, schema: Type[T], model_name: Optional[str] = None, timeout_ms: int = 20000) -> T:
        self._ensure()
        model_name = model_name or self.model
        last_err = None
        for attempt in range(2):
            try:
                config = self.types.GenerateContentConfig(
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
                contents.append(self.types.Content(role=role, parts=[self.types.Part(text=h.get('text', ''))]))
            contents.append(self.types.Content(role='user', parts=[self.types.Part(text=user)]))
            config = self.types.GenerateContentConfig(
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
            if not self.genai or not p:
                return {"provider": "vertex", "auto_resolved": "vertex", "configured": False, "model": m, "reachable": False, "hint": "not configured"}
            try:
                self.client = self.genai.Client(vertexai=True, project=p, location=l)
            except Exception as e:
                return {"provider": "vertex", "auto_resolved": "vertex", "configured": True, "model": m, "reachable": False, "hint": str(e)[:80]}
            try:
                resp = self.client.models.generate_content(model=m, contents="say ok", config=self.types.GenerateContentConfig(max_output_tokens=64, temperature=0))
            except Exception as e:
                msg = str(e)
                if "404" in msg:
                    return {"provider": "vertex", "auto_resolved": "vertex", "configured": True, "model": m, "reachable": False, "hint": "location global and a valid model id"}
                if "403" in msg:
                    return {"provider": "vertex", "auto_resolved": "vertex", "configured": True, "model": m, "reachable": False, "hint": "enable aiplatform.googleapis.com and billing"}
                return {"provider": "vertex", "auto_resolved": "vertex", "configured": True, "model": m, "reachable": False, "hint": msg[:80]}
            text = getattr(resp, 'text', None)
            if not text:
                try:
                    if getattr(resp, 'candidates', None):
                        text = resp.candidates[0].content.parts[0].text
                except Exception:
                    text = None
            if not text or not str(text).strip():
                return {"provider": "vertex", "auto_resolved": "vertex", "configured": True, "model": m, "reachable": False, "hint": "empty response (thinking tokens or limits)"}
            return {"provider": "vertex", "auto_resolved": "vertex", "configured": True, "model": m, "reachable": True}
        except Exception as e:
            return {"provider": "vertex", "auto_resolved": "vertex", "configured": False, "model": os.environ.get('GEMINI_MODEL','gemini-3.8-flash'), "reachable": False, "hint": str(e)[:80]}


class AIClient:
    def __init__(self):
        self.provider = self._select()
        self.name = getattr(self.provider, 'name', 'none')
    def _select(self):
        prov = (settings.AI_PROVIDER or os.getenv('AI_PROVIDER') or 'auto').lower()
        groq_key = settings.GROQ_API_KEY or os.getenv('GROQ_API_KEY') or ''
        groq_model = settings.GROQ_MODEL or os.getenv('GROQ_MODEL') or ''
        gproj = settings.GOOGLE_CLOUD_PROJECT or os.getenv('GOOGLE_CLOUD_PROJECT') or ''
        if prov == 'none':
            return NoneProvider()
        if prov == 'groq':
            return GroqProvider()
        if prov == 'vertex':
            return VertexProvider()
        # auto
        if groq_key and groq_model:
            return GroqProvider()
        if gproj:
            return VertexProvider()
        return NoneProvider()
    def generate_json(self, system: str, user: str, schema: Type[T], model_name: Optional[str] = None, timeout_ms: int = 20000) -> T:
        try:
            return self.provider.generate_json(system, user, schema, model_name=model_name, timeout_ms=timeout_ms)
        except AIUnavailable:
            fb = (settings.AI_FALLBACK_PROVIDER or os.getenv('AI_FALLBACK_PROVIDER') or 'none').lower()
            if fb and fb != 'none' and fb != self.provider.name:
                try:
                    if fb == 'groq':
                        p = GroqProvider()
                    elif fb == 'vertex':
                        p = VertexProvider()
                    else:
                        raise
                    return p.generate_json(system, user, schema, model_name=model_name, timeout_ms=timeout_ms)
                except Exception:
                    pass
            raise
    def generate_text(self, system: str, history: list, user: str, model_name: Optional[str] = None, timeout_ms: int = 20000) -> str:
        try:
            return self.provider.generate_text(system, history, user, model_name=model_name, timeout_ms=timeout_ms)
        except AIUnavailable:
            fb = (settings.AI_FALLBACK_PROVIDER or os.getenv('AI_FALLBACK_PROVIDER') or 'none').lower()
            if fb and fb != 'none' and fb != self.provider.name:
                try:
                    if fb == 'groq':
                        p = GroqProvider()
                    elif fb == 'vertex':
                        p = VertexProvider()
                    else:
                        raise
                    return p.generate_text(system, history, user, model_name=model_name, timeout_ms=timeout_ms)
                except Exception:
                    pass
            raise
    def _call_json(self, schema, system: str, user: str, model_name=None):
        return self.generate_json(system, user, schema, model_name=model_name)

    def health_check(self):
        try:
            h = self.provider.health_check()
            h['auto_resolved'] = self.provider.name
            if h.get('provider') == 'groq':
                h['provider'] = 'groq'
            elif h.get('provider') == 'vertex':
                h['provider'] = 'vertex'
            elif h.get('provider') == 'none':
                h['provider'] = 'none'
            return h
        except Exception as e:
            return {"provider": self.provider.name, "auto_resolved": self.provider.name, "configured": False, "model": None, "reachable": False, "hint": str(e)[:80]}


ai_client = AIClient()
