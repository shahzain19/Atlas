import pytest
from atlas_ai.policy.policy_engine import (
    Policy, EpsilonGreedyPolicy, RandomPolicy, PolicyEngine, Observation, Action
)


@pytest.fixture
def policy():
    return EpsilonGreedyPolicy()


@pytest.fixture
def engine(policy):
    return PolicyEngine(policy)


@pytest.mark.asyncio
async def test_select_action_returns_action(policy):
    obs = Observation(state={"position": 1.0, "target": 5.0}, timestamp=1000.0)
    action = await policy.select_action(obs)
    assert isinstance(action, Action)
    assert action.type in ("move_forward", "turn_left", "turn_right", "stop")
    assert 0 <= action.confidence <= 1


@pytest.mark.asyncio
async def test_select_action_deterministic(policy):
    obs = Observation(state={"x": 10, "y": 20}, timestamp=500.0)
    a1 = await policy.select_action(obs)
    a2 = await policy.select_action(obs)
    assert a1.type == a2.type
    assert a1.params["speed"] == a2.params["speed"]
    assert a1.confidence == a2.confidence


@pytest.mark.asyncio
async def test_select_action_different_states(policy):
    obs1 = Observation(state={"x": 1}, timestamp=100.0)
    obs2 = Observation(state={"x": 999}, timestamp=100.0)
    a1 = await policy.select_action(obs1)
    a2 = await policy.select_action(obs2)
    assert not (a1.type == a2.type and a1.params["speed"] == a2.params["speed"] and a1.confidence == a2.confidence)


def test_update_increases_reward(policy):
    assert policy.get_average_reward() == 0.0
    policy.update(10.0)
    assert policy.get_average_reward() == 10.0
    policy.update(5.0)
    assert policy.get_average_reward() == 7.5


def test_average_reward_no_updates(policy):
    assert policy.get_average_reward() == 0.0


@pytest.mark.asyncio
async def test_engine_act(engine):
    obs = Observation(state={"test": True}, timestamp=1.0)
    action = await engine.act(obs)
    assert isinstance(action, Action)


def test_engine_update(engine):
    engine.update(5.0)
    assert engine.policy.get_average_reward() == 5.0


def test_set_policy(engine):
    new_policy = RandomPolicy()
    engine.set_policy(new_policy)
    assert engine.policy is new_policy


def test_random_policy_inherits():
    rp = RandomPolicy()
    assert isinstance(rp, EpsilonGreedyPolicy)


@pytest.mark.asyncio
async def test_action_params_contain_speed(policy):
    obs = Observation(state={"test": True}, timestamp=1.0)
    action = await policy.select_action(obs)
    assert "speed" in action.params
    assert 0.1 <= action.params["speed"] <= 1.0


def test_action_fields():
    action = Action("move_forward", {"speed": 0.5}, 0.9)
    assert action.type == "move_forward"
    assert action.params == {"speed": 0.5}
    assert action.confidence == 0.9


def test_state_change_after_update(policy):
    before = policy.get_average_reward()
    policy.update(10.0)
    assert policy.get_average_reward() != before
    policy.update(-5.0)
    assert policy.get_average_reward() == 2.5


@pytest.mark.asyncio
async def test_engine_act_uses_policy():
    class MockPolicy(Policy):
        async def select_action(self, obs):
            return Action("stop", {}, 1.0)
        def update(self, reward):
            pass

    eng = PolicyEngine(MockPolicy())
    action = await eng.act(Observation(state={}, timestamp=0.0))
    assert action.type == "stop"
