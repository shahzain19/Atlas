import pytest
from atlas_ai.types import Event, EventPriority
from atlas_ai.intelligence.event_intelligence import EventIntelligence


def test_classify_system():
    ei = EventIntelligence()
    event = Event(type="TICK", timestamp=0.0)
    processed = ei.process(event)
    assert processed.metadata["category"] == "system"


def test_classify_operation():
    ei = EventIntelligence()
    event = Event(type="TASK_COMPLETE", timestamp=0.0)
    processed = ei.process(event)
    assert processed.metadata["category"] == "operation"


def test_classify_perception():
    ei = EventIntelligence()
    event = Event(type="SENSOR_READING", timestamp=0.0)
    processed = ei.process(event)
    assert processed.metadata["category"] == "perception"


def test_classify_general():
    ei = EventIntelligence()
    event = Event(type="CUSTOM_EVENT", timestamp=0.0)
    processed = ei.process(event)
    assert processed.metadata["category"] == "general"


def test_score_values():
    ei = EventIntelligence()
    assert ei.score(Event(type="TICK", timestamp=0.0)) == 0.1
    assert ei.score(Event(type="RUNTIME_HEALTH", timestamp=0.0)) == 0.5
    assert ei.score(Event(type="TASK_REQUEST", timestamp=0.0)) == 0.8
    assert ei.score(Event(type="TASK_FAILURE", timestamp=0.0)) == 1.0
    assert ei.score(Event(type="UNKNOWN", timestamp=0.0)) == 0.3


def test_map_to_priority():
    ei = EventIntelligence()
    assert ei.map_to_priority(0.95) == EventPriority.CRITICAL
    assert ei.map_to_priority(0.8) == EventPriority.HIGH
    assert ei.map_to_priority(0.5) == EventPriority.MEDIUM
    assert ei.map_to_priority(0.2) == EventPriority.LOW


def test_process_preserves_fields():
    ei = EventIntelligence()
    original = Event(type="TASK_FAILURE", timestamp=1234.0, source="test", payload={"info": "value"})
    processed = ei.process(original)
    assert processed.type == "TASK_FAILURE"
    assert processed.timestamp == 1234.0
    assert processed.source == "test"
    assert processed.payload == {"info": "value"}
    assert processed.priority == EventPriority.CRITICAL
    assert processed.metadata["category"] == "operation"
    assert processed.metadata["importance"] == 1.0


def test_process_boundary_importance():
    ei = EventIntelligence()
    event = Event(type="RUNTIME_HEALTH", timestamp=0.0)
    processed = ei.process(event)
    assert processed.metadata["importance"] == 0.5
    assert processed.priority == EventPriority.MEDIUM


def test_process_high_importance():
    ei = EventIntelligence()
    event = Event(type="TASK_FAILURE", timestamp=0.0)
    processed = ei.process(event)
    assert processed.metadata["importance"] == 1.0
    assert processed.priority == EventPriority.CRITICAL


def test_runtime_prefix_classification():
    ei = EventIntelligence()
    event = Event(type="RUNTIME_ERROR", timestamp=0.0)
    assert ei.classify(event) == "system"


def test_object_prefix_classification():
    ei = EventIntelligence()
    event = Event(type="OBJECT_DETECTED", timestamp=0.0)
    assert ei.classify(event) == "perception"


def test_gps_prefix_classification():
    ei = EventIntelligence()
    event = Event(type="GPS_UPDATE", timestamp=0.0)
    assert ei.classify(event) == "perception"


def test_image_prefix_classification():
    ei = EventIntelligence()
    event = Event(type="IMAGE_CAPTURED", timestamp=0.0)
    assert ei.classify(event) == "perception"
