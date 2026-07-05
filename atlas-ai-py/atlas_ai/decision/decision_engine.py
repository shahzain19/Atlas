from atlas_ai.types import DecisionContext, Decision


class DecisionEngine:
    def __init__(self, runtime=None):
        self.runtime = runtime

    def decide(self, ctx: DecisionContext) -> list[Decision]:
        event = ctx.event
        decisions: list[Decision] = []

        if event.type == "TICK":
            dt = event.payload.get("dt", 0) if isinstance(event.payload, dict) else 0

            if dt > 40:
                def make_execute(runtime, event):
                    def execute():
                        tid = f"latency-{event.timestamp}"
                        if runtime is not None and hasattr(runtime, "register_task"):
                            runtime.register_task(tid)
                        if runtime is not None and hasattr(runtime, "run_task"):
                            runtime.run_task(tid)
                    return execute

                decisions.append(Decision(
                    name="HighLatencyResponse",
                    confidence=0.8,
                    execute=make_execute(self.runtime, event),
                ))

        return decisions
