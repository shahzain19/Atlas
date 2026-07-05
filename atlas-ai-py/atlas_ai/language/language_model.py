import math
from atlas_ai.types import hash_string, seeded_range


class LanguageGenerationOptions:
    def __init__(self):
        self.max_tokens: int = 1024
        self.temperature: float = 0.7
        self.top_p: float = 1.0
        self.stop_words: list[str] = []


class TextAnalysisResult:
    def __init__(self):
        self.topics: list[str] = []
        self.sentiment: str = "neutral"
        self.keywords: list[str] = []
        self.entities: list[str] = []
        self.confidence: float = 0


class EmbeddingResult:
    def __init__(self):
        self.vector: list[float] = []
        self.dimensions: int = 0
        self.model: str = ""


class LanguageModel:
    def __init__(self, model_name: str = "atlas-language-base", max_tokens: int = 1024, temperature: float = 0.7):
        self.model_name = model_name
        self.max_tokens = max_tokens
        self.temperature = temperature

    async def generate(self, prompt: str, options: dict | None = None) -> str:
        max_t = options.get("maxTokens", self.max_tokens) if options else self.max_tokens
        temp = options.get("temperature", self.temperature) if options else self.temperature
        words = [w for w in prompt.split() if w]
        response_words = words[:min(max_t, len(words) + 3)]
        if not response_words:
            response_words.append("acknowledged")
        return f"{' '.join(response_words)} (temp={temp:.2f})"

    async def analyze(self, text: str) -> TextAnalysisResult:
        words = [w for w in text.lower().split() if len(w) > 3]
        seen_topics: set[str] = set()
        topics: list[str] = []
        for w in words:
            if w not in seen_topics:
                seen_topics.add(w)
                topics.append(w)
            if len(topics) >= 5:
                break
        keywords = topics[:3]

        if any(word in text.lower() for word in ("good", "great", "excellent")):
            sentiment = "positive"
        elif any(word in text.lower() for word in ("bad", "terrible", "awful")):
            sentiment = "negative"
        else:
            sentiment = "neutral"

        tokens = text.split()
        entities = [
            t for t in tokens
            if len(t) > 1 and t[0].isupper() and (len(t) < 2 or t[1].islower())
        ]

        result = TextAnalysisResult()
        result.topics = topics
        result.sentiment = sentiment
        result.keywords = keywords
        result.entities = entities
        result.confidence = 0.7 + seeded_range(hash_string(text), 0, 0.25)
        return result

    async def embed(self, text: str) -> EmbeddingResult:
        dimensions = 128
        vector = [0.0] * dimensions
        words = [w for w in text.lower().split() if w]

        for word in words:
            seed = hash_string(word)
            index = seed % dimensions
            vector[index] += 1.0

        magnitude = math.sqrt(sum(v * v for v in vector))
        if magnitude > 0:
            vector = [v / magnitude for v in vector]

        result = EmbeddingResult()
        result.vector = vector
        result.dimensions = dimensions
        result.model = self.model_name
        return result

    def cosine_similarity(self, a: list[float], b: list[float]) -> float:
        length = min(len(a), len(b))
        dot = 0.0
        mag_a = 0.0
        mag_b = 0.0
        for i in range(length):
            dot += a[i] * b[i]
            mag_a += a[i] * a[i]
            mag_b += b[i] * b[i]
        if mag_a == 0 or mag_b == 0:
            return 0
        return dot / (math.sqrt(mag_a) * math.sqrt(mag_b))
