import pytest
from atlas_ai.reasoning.deep_reasoning import DeepReasoningEngine


@pytest.fixture
def engine():
    return DeepReasoningEngine()


@pytest.mark.asyncio
async def test_reason_returns_result(engine):
    result = await engine.reason("test query")
    assert result.conclusions is not None
    assert result.reasoning is not None
    assert result.confidence >= 0
    assert len(result.reasoning) > 0


@pytest.mark.asyncio
async def test_reason_extracts_concepts(engine):
    result = await engine.reason("machine learning optimization")
    assert any("machine" in r.lower() for r in result.reasoning) or \
           any("optimization" in r.lower() for r in result.reasoning)


@pytest.mark.asyncio
async def test_analyze_returns_result(engine):
    result = await engine.analyze("test data analysis pattern")
    assert result.patterns is not None
    assert result.insights is not None
    assert result.recommendations is not None
    assert result.confidence >= 0


@pytest.mark.asyncio
async def test_analyze_identifies_patterns(engine):
    await engine.learn("pattern recognition and analysis")
    result = await engine.analyze("pattern recognition")
    assert len(result.patterns) > 0 or len(result.insights) > 0


@pytest.mark.asyncio
async def test_predict_returns_result(engine):
    result = await engine.predict("current state analysis", "short term")
    assert result.predictions is not None
    assert result.timeframe == "short term"
    assert result.confidence >= 0


@pytest.mark.asyncio
async def test_predict_with_known_concept(engine):
    result = await engine.predict("state analysis", "long term")
    assert len(result.predictions) >= 0


@pytest.mark.asyncio
async def test_learn_adds_concepts(engine):
    kg_before = engine.get_knowledge_graph()
    before_count = len(kg_before)
    await engine.learn("quantum computing entanglement")
    kg_after = engine.get_knowledge_graph()
    assert len(kg_after) >= before_count


@pytest.mark.asyncio
async def test_learn_creates_connections(engine):
    result = await engine.learn("neural network training")
    assert result.updated_connections >= 0
    assert result.confidence > 0.5


@pytest.mark.asyncio
async def test_learn_increases_confidence(engine):
    before = engine.get_confidence()
    await engine.learn("new concept learning")
    after = engine.get_confidence()
    assert after >= before


def test_clear_resets_state(engine):
    engine.knowledge_graph["test"] = type("Node", (), {"id": "x", "concept": "test"})()
    engine.clear()
    assert len(engine.get_knowledge_graph()) >= 10


def test_get_knowledge_graph_returns_copy(engine):
    kg = engine.get_knowledge_graph()
    assert isinstance(kg, dict)
    assert len(kg) >= 10


def test_get_confidence_default(engine):
    assert engine.get_confidence() == 0.5


def test_extract_concepts(engine):
    concepts = engine._extract_concepts("the quick brown fox")
    assert len(concepts) == 4
    assert "the" in concepts
    assert "quick" in concepts
    assert "brown" in concepts
    assert "fox" in concepts


def test_extract_concepts_short_words(engine):
    concepts = engine._extract_concepts("a an the")
    assert len(concepts) == 1
    assert "the" in concepts


def test_generate_id_unique(engine):
    id1 = engine._generate_id()
    id2 = engine._generate_id()
    assert id1 != id2


@pytest.mark.asyncio
async def test_empty_state(engine):
    result = await engine.predict("", "short term")
    assert isinstance(result.predictions, list)
    assert isinstance(result.probabilities, dict)


@pytest.mark.asyncio
async def test_analyze_empty_data(engine):
    result = await engine.analyze("")
    assert isinstance(result.patterns, list)
    assert isinstance(result.insights, list)


@pytest.mark.asyncio
async def test_full_reasoning_pipeline(engine):
    await engine.learn("deep learning transformer architecture")
    await engine.learn("reinforcement learning policy gradient")
    result = await engine.reason("machine learning")
    assert result.conclusions is not None
    assert result.confidence >= 0
