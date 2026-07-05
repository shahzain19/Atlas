from atlas_ai.types import Event, DecisionContext


class DecisionRouter:
    def __init__(self, runtime=None, engine=None):
        self.runtime = runtime
        self.engine = engine

    def handle(self, event: Event):
        category = event.metadata.get("category", "unknown") if event.metadata else "unknown"
        importance = event.metadata.get("importance", 0) if event.metadata else 0

        if importance > 0.7:
            print(f"[DecisionRouter] High Importance Event: {event.type} ({category})")

        core_decisions = []
        if self.engine is not None:
            core_decisions = self.engine.decide(DecisionContext(event=event))

        agent_decisions = []
        if self.runtime is not None and hasattr(self.runtime, "agents") and hasattr(self.runtime.agents, "get_all"):
            agent_decisions = self.runtime.agents.get_all().flat_map(lambda agent: agent.handle(event))

        all_decisions = list(core_decisions) + list(agent_decisions)

        for decision in all_decisions:
            if decision.confidence > 0.5:
                decision.execute()
