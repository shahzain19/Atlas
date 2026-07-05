import pytest
import math
from atlas_ai.language.language_model import LanguageModel


@pytest.fixture
def lm():
    return LanguageModel()


@pytest.mark.asyncio
async def test_generate_returns_string(lm):
    result = await lm.generate("hello world")
    assert isinstance(result, str)
    assert len(result) > 0


@pytest.mark.asyncio
async def test_generate_appends_temperature(lm):
    result = await lm.generate("test")
    assert "(temp=" in result


@pytest.mark.asyncio
async def test_generate_with_options(lm):
    result = await lm.generate("a b c d e", {"maxTokens": 3, "temperature": 0.5})
    assert "(temp=0.50)" in result
    words = result.split()
    # Should be limited
    assert len([w for w in result.split() if not w.startswith("(")]) <= 3 + 3  # input words + possible extra


@pytest.mark.asyncio
async def test_generate_empty_prompt(lm):
    result = await lm.generate("")
    assert "acknowledged" in result


@pytest.mark.asyncio
async def test_analyze_returns_structure(lm):
    result = await lm.analyze("The quick brown fox jumps over the lazy dog")
    assert isinstance(result.topics, list)
    assert isinstance(result.keywords, list)
    assert isinstance(result.entities, list)
    assert result.sentiment in ("positive", "negative", "neutral")
    assert 0 <= result.confidence <= 1


@pytest.mark.asyncio
async def test_analyze_sentiment_positive(lm):
    result = await lm.analyze("This is a good and great day")
    assert result.sentiment == "positive"


@pytest.mark.asyncio
async def test_analyze_sentiment_negative(lm):
    result = await lm.analyze("This is a bad and terrible day")
    assert result.sentiment == "negative"


@pytest.mark.asyncio
async def test_analyze_sentiment_neutral(lm):
    result = await lm.analyze("This is a normal day")
    assert result.sentiment == "neutral"


@pytest.mark.asyncio
async def test_analyze_entities(lm):
    result = await lm.analyze("Alice met Bob in Paris")
    entities = [e for e in result.entities if e]
    assert len(entities) > 0


@pytest.mark.asyncio
async def test_embed_returns_vector(lm):
    result = await lm.embed("hello world")
    assert len(result.vector) == 128
    assert result.dimensions == 128
    assert result.model == "atlas-language-base"


@pytest.mark.asyncio
async def test_embed_normalized(lm):
    result = await lm.embed("test text")
    magnitude = math.sqrt(sum(v * v for v in result.vector))
    assert magnitude == pytest.approx(1.0, rel=1e-6) or magnitude == 0


@pytest.mark.asyncio
async def test_embed_consistency(lm):
    r1 = await lm.embed("hello world")
    r2 = await lm.embed("hello world")
    assert r1.vector == r2.vector


def test_cosine_similarity_identical(lm):
    v = [1.0, 0.0, 0.0]
    sim = lm.cosine_similarity(v, v)
    assert sim == pytest.approx(1.0)


def test_cosine_similarity_orthogonal(lm):
    sim = lm.cosine_similarity([1.0, 0.0], [0.0, 1.0])
    assert sim == pytest.approx(0.0)


def test_cosine_similarity_zero_vector(lm):
    sim = lm.cosine_similarity([0.0, 0.0], [1.0, 0.0])
    assert sim == 0.0


def test_cosine_similarity_different_lengths(lm):
    sim = lm.cosine_similarity([1.0, 0.0, 0.0], [1.0, 0.0])
    assert sim == pytest.approx(1.0)


@pytest.mark.asyncio
async def test_generate_respects_temperature(lm):
    r1 = await lm.generate("test", {"temperature": 0.1})
    r2 = await lm.generate("test", {"temperature": 0.9})
    assert "(temp=0.10)" in r1
    assert "(temp=0.90)" in r2


def test_cosine_similarity_partial(lm):
    sim = lm.cosine_similarity([1.0, 0.5], [0.5, 1.0])
    assert 0 < sim < 1


@pytest.mark.asyncio
async def test_analyze_keywords_are_subset_of_topics(lm):
    result = await lm.analyze("machine learning deep neural networks")
    for kw in result.keywords:
        assert kw in result.topics


@pytest.mark.asyncio
async def test_embed_deterministic(lm):
    r1 = await lm.embed("deterministic seed test")
    r2 = await lm.embed("deterministic seed test")
    assert r1.vector == r2.vector
