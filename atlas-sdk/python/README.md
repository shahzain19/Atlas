# Atlas Python SDK

Official Python SDK for the Atlas universal intelligent machine platform.

## Installation

```bash
cd atlas-sdk/python
pip install -e .
```

## Quick Start

```python
from atlas_sdk import AtlasClient, Entity
import time

# Create a client
client = AtlasClient()

# Create an entity
entity = Entity(id="robot-001", name="Test Robot")
client.register_entity(entity)

# Send an event
client.emit_event("robot:started", { "status": "ready" })

print("Atlas client connected!")
```
