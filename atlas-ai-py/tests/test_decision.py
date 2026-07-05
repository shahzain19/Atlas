import pytest
from atlas_ai.types import Event, EventPriority, DecisionContext
from atlas_ai.decision.decision_engine import DecisionEngine
from atlas_ai.decision.decision_router import DecisionRouter


def test_decision_engine_tick_high_latency():
    engine = DecisionEngine()
    event = Event(type="TICK", timestamp=1000.0, payload={"dt": 50})
    ctx = DecisionContext(event=event)
    decisions = engine.decide(ctx)
    assert len(decisions) == 1
    assert decisions[0].name == "HighLatencyResponse"
    assert decisions[0].confidence == 0.8


def test_decision_engine_tick_low_latency():
    engine = DecisionEngine()
    event = Event(type="TICK", timestamp=1000.0, payload={"dt": 10})
    ctx = DecisionContext(event=event)
    decisions = engine.decide(ctx)
    assert len(decisions) == 0


def test_decision_engine_non_tick():
    engine = DecisionEngine()
    event = Event(type="OTHER", timestamp=1000.0, payload={})
    ctx = DecisionContext(event=event)
    decisions = engine.decide(ctx)
    assert len(decisions) == 0


def test_decision_engine_empty_payload():
    engine = DecisionEngine()
    event = Event(type="TICK", timestamp=1000.0)
    ctx = DecisionContext(event=event)
    decisions = engine.decide(ctx)
    assert len(decisions) == 0


def test_decision_router_low_importance():
    executed = []
    class MockEngine:
        def decide(self, ctx):
            return []
    router = DecisionRouter(engine=MockEngine())
    event = Event(type="TEST", timestamp=0.0, metadata={"importance": 0.2, "category": "test"})
    router.handle(event)
    assert len(executed) == 0


def test_decision_router_executes_high_confidence():
    executed = []
    def make_exec(decision_self=None):
        executed.append(True)
    class MockEngine:
        def decide(self, ctx):
            d = type("Decision", (), {"name": "TestDecision", "confidence": 0.8, "execute": make_exec})
            return [d()]
    router = DecisionRouter(engine=MockEngine())
    event = Event(type="TICK", timestamp=0.0, payload={"dt": 50})
    router.handle(event)
    assert len(executed) == 1


def test_decision_router_skips_low_confidence():
    executed = []
    def make_exec():
        executed.append(True)
    class MockEngine:
        def decide(self, ctx):
            d = type("Decision", (), {"name": "LowConf", "confidence": 0.3, "execute": make_exec})
            return [d()]
    router = DecisionRouter(engine=MockEngine())
    event = Event(type="TEST", timestamp=0.0)
    router.handle(event)
    assert len(executed) == 0


def test_decision_router_state_change():
    engine = DecisionEngine()
    before_decisions = engine.decide(DecisionContext(event=Event(type="TICK", timestamp=0.0, payload={"dt": 10})))
    assert len(before_decisions) == 0
    after_decisions = engine.decide(DecisionContext(event=Event(type="TICK", timestamp=0.0, payload={"dt": 50})))
    assert len(after_decisions) == 1
    assert after_decisions[0].name == "HighLatencyResponse"


def test_decision_execute_called():
    calls = []
    runtime = type("MockRuntime", (), {
        "register_task": lambda self, tid: calls.append(("register", tid)),
        "run_task": lambda self, tid: calls.append(("run", tid)),
    })()
    engine = DecisionEngine(runtime=runtime)
    event = Event(type="TICK", timestamp=1234.0, payload={"dt": 100})
    ctx = DecisionContext(event=event)
    decisions = engine.decide(ctx)
    assert len(decisions) == 1
    decisions[0].execute()
    assert len(calls) == 2
    assert calls[0][0] == "register"
    assert "latency-1234.0" in calls[0][1]
    assert calls[1][0] == "run"
