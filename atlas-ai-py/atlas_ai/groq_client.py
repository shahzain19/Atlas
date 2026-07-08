import json
import os
import time
import hashlib
from groq import AsyncGroq

API_KEY = os.environ.get("GROQ_API_KEY")
if not API_KEY:
    pass  # GroqClient will raise at runtime if used without key
DEFAULT_MODEL = "llama-3.3-70b-versatile"
CACHE_MAX = 256
CACHE_TTL_S = 300


class GroqClient:
    _instance = None

    def __init__(self, api_key: str = None, model: str = None):
        self.client = AsyncGroq(api_key=api_key or API_KEY)
        self.model = model or DEFAULT_MODEL
        self._cache = {}
        self._cache_keys = []

    @classmethod
    def get_instance(cls) -> "GroqClient":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _cache_key(self, prompt: str, system: str = None, temperature: float = None) -> str:
        raw = f"{self.model}|{prompt}|{system or ''}|{temperature or ''}"
        return hashlib.sha256(raw.encode()).hexdigest()

    def _cache_get(self, key: str) -> str | None:
        entry = self._cache.get(key)
        if entry is None:
            return None
        if time.time() > entry["expires_at"]:
            del self._cache[key]
            return None
        return entry["result"]

    def _cache_set(self, key: str, result: str):
        if len(self._cache) >= CACHE_MAX:
            oldest = self._cache_keys.pop(0) if self._cache_keys else None
            if oldest and oldest in self._cache:
                del self._cache[oldest]
        self._cache[key] = {"result": result, "expires_at": time.time() + CACHE_TTL_S}
        self._cache_keys.append(key)

    def set_model(self, model: str):
        self.model = model
        self._cache.clear()
        self._cache_keys.clear()

    def clear_cache(self):
        self._cache.clear()
        self._cache_keys.clear()

    async def generate(self, prompt: str, system: str = None,
                       max_tokens: int = 512, temperature: float = 0.7,
                       top_p: float = 0.9, no_cache: bool = False) -> str:
        if not no_cache:
            key = self._cache_key(prompt, system, temperature)
            cached = self._cache_get(key)
            if cached is not None:
                return cached

        try:
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})

            completion = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
            )
            result = completion.choices[0].message.content or ""

            if not no_cache and result:
                key = self._cache_key(prompt, system, temperature)
                self._cache_set(key, result)
            return result
        except Exception as e:
            print(f"[Groq] API error: {e}")
            return ""

    async def analyze(self, text: str) -> dict:
        prompt = f"""Analyze the following text and return a JSON object with:
- topics: array of main topics discussed
- sentiment: "positive", "negative", or "neutral"
- keywords: array of key keywords
- entities: array of named entities found
- confidence: a number between 0 and 1

Text: "{text}"

Return ONLY valid JSON."""

        result = await self.generate(prompt, system="You are a text analysis engine. Return only valid JSON.", temperature=0.1)

        try:
            start = result.index("{")
            end = result.rindex("}") + 1
            return json.loads(result[start:end])
        except (ValueError, json.JSONDecodeError):
            return {"topics": [], "sentiment": "neutral", "keywords": [], "entities": [], "confidence": 0.5}

    async def embed(self, text: str) -> list[float]:
        words = text.lower().split()
        if not words:
            return []

        prompt = f'Generate a semantic embedding vector (128 floats) for the text: "{text}"\nReturn ONLY a JSON array of 128 numbers between -1 and 1. No other text.'

        result = await self.generate(prompt, system="You generate embedding vectors. Return only a JSON array of 128 floats.", temperature=0.1, max_tokens=1024)

        try:
            start = result.index("[")
            end = result.rindex("]") + 1
            parsed = json.loads(result[start:end])
            if isinstance(parsed, list) and len(parsed) == 128:
                return parsed
        except (ValueError, json.JSONDecodeError):
            pass

        vector = [0.0] * 128
        for i, w in enumerate(words[:128]):
            vector[i] = (len(w) % 20) / 20
        return vector

    async def detect_objects(self, image_description: str) -> list[dict]:
        prompt = f"""Given this image description: "{image_description}"

Return a JSON array of detected objects. Each object must have:
- label: string (what the object is)
- confidence: number 0-1
- boundingBox: {{ x, y, width, height }} as relative coordinates 0-1

Return ONLY a valid JSON array. No other text."""

        result = await self.generate(prompt, system="You are a computer vision detection system. Return only valid JSON arrays.", temperature=0.1, max_tokens=512)

        try:
            start = result.index("[")
            end = result.rindex("]") + 1
            return json.loads(result[start:end])
        except (ValueError, json.JSONDecodeError):
            return []

    async def decide(self, context: str, actions: list[str]) -> dict:
        prompt = f"""Given the current context: "{context}"

Choose the best action from: [{', '.join(actions)}]

Return a JSON object with:
- action: the chosen action (must be one of the listed)
- confidence: number 0-1
- reasoning: short explanation

Return ONLY valid JSON."""

        result = await self.generate(prompt, system="You are a decision engine. Choose the best action and explain why.", temperature=0.3, max_tokens=256)

        try:
            start = result.index("{")
            end = result.rindex("}") + 1
            return json.loads(result[start:end])
        except (ValueError, json.JSONDecodeError):
            return {"action": actions[0] if actions else "stop", "confidence": 0.5, "reasoning": "fallback"}

    def cosine_similarity(self, a: list[float], b: list[float]) -> float:
        length = min(len(a), len(b))
        dot = mag_a = mag_b = 0.0
        for i in range(length):
            dot += a[i] * b[i]
            mag_a += a[i] * a[i]
            mag_b += b[i] * b[i]
        if mag_a == 0 or mag_b == 0:
            return 0
        return dot / ((mag_a ** 0.5) * (mag_b ** 0.5))
