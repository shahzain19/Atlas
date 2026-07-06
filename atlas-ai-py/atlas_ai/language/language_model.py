from atlas_ai.groq_client import GroqClient


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
    def __init__(self, model_name: str = "llama-3.3-70b-versatile",
                 max_tokens: int = 1024, temperature: float = 0.7):
        self.groq = GroqClient.get_instance()
        self.model_name = model_name
        self.max_tokens = max_tokens
        self.temperature = temperature

    async def generate(self, prompt: str, options: dict | None = None) -> str:
        return await self.groq.generate(
            prompt,
            max_tokens=options.get("maxTokens", self.max_tokens) if options else self.max_tokens,
            temperature=options.get("temperature", self.temperature) if options else self.temperature,
            top_p=options.get("topP", 0.9) if options else 0.9,
        )

    async def analyze(self, text: str) -> TextAnalysisResult:
        result = await self.groq.analyze(text)
        obj = TextAnalysisResult()
        obj.topics = result.get("topics", [])
        obj.sentiment = result.get("sentiment", "neutral")
        obj.keywords = result.get("keywords", [])
        obj.entities = result.get("entities", [])
        obj.confidence = result.get("confidence", 0.5)
        return obj

    async def embed(self, text: str) -> EmbeddingResult:
        vector = await self.groq.embed(text)
        obj = EmbeddingResult()
        obj.vector = vector
        obj.dimensions = len(vector)
        obj.model = self.model_name
        return obj

    def cosine_similarity(self, a: list[float], b: list[float]) -> float:
        return self.groq.cosine_similarity(a, b)
