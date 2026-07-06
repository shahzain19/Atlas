import json
from abc import ABC, abstractmethod
from atlas_ai.groq_client import GroqClient


class Observation:
    def __init__(self, state: dict, timestamp: float):
        self.state = state
        self.timestamp = timestamp


class Action:
    def __init__(self, action_type: str, params: dict, confidence: float):
        self.type = action_type
        self.params = params
        self.confidence = confidence


class Policy(ABC):
    @abstractmethod
    async def select_action(self, observation: Observation) -> Action:
        ...

    @abstractmethod
    def update(self, reward: float):
        ...


class EpsilonGreedyPolicy(Policy):
    def __init__(self):
        self.groq = GroqClient.get_instance()
        self.reward_sum = 0.0
        self.updates = 0

    async def select_action(self, observation: Observation) -> Action:
        context = json.dumps(observation.state, default=str)
        actions = ["move_forward", "turn_left", "turn_right", "stop", "scan", "return"]

        result = await self.groq.decide(context, actions)

        import random
        return Action(
            action_type=result.get("action", actions[0]),
            params={"speed": random.uniform(0.5, 1.0)},
            confidence=result.get("confidence", 0.5),
        )

    def update(self, reward: float):
        self.reward_sum += reward
        self.updates += 1

    def get_average_reward(self) -> float:
        return self.reward_sum / self.updates if self.updates > 0 else 0.0


class RandomPolicy(EpsilonGreedyPolicy):
    pass


class PolicyEngine:
    def __init__(self, policy: Policy):
        self.policy = policy

    def set_policy(self, policy: Policy):
        self.policy = policy

    async def act(self, observation: Observation) -> Action:
        return await self.policy.select_action(observation)

    def update(self, reward: float):
        self.policy.update(reward)
