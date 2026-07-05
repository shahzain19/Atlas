import {
  NodeStatus,
  BehaviorNode,
  ActionNode,
  ConditionNode,
  SequenceNode,
  SelectorNode,
  ParallelNode,
  RepeatNode,
  InverterNode,
  BehaviorTree,
} from "../../atlas-planning/BehaviorTree/BehaviorTree";

// ---------------------------------------------------------------------------
// ActionNode
// ---------------------------------------------------------------------------
describe("ActionNode", () => {
  it("calls the provided action function and returns its status", () => {
    const action = jest.fn(() => NodeStatus.SUCCESS);
    const node = new ActionNode("test-action", action);
    expect(node.tick()).toBe(NodeStatus.SUCCESS);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("propagates RUNNING from the action", () => {
    const node = new ActionNode("running-action", () => NodeStatus.RUNNING);
    expect(node.tick()).toBe(NodeStatus.RUNNING);
  });

  it("propagates FAILURE from the action", () => {
    const node = new ActionNode("fail-action", () => NodeStatus.FAILURE);
    expect(node.tick()).toBe(NodeStatus.FAILURE);
  });

  it("has a name", () => {
    const node = new ActionNode("named-action", () => NodeStatus.SUCCESS);
    expect(node.name).toBe("named-action");
  });

  it("reset is a no-op (no state to clear)", () => {
    const node = new ActionNode("noop", () => NodeStatus.SUCCESS);
    expect(() => node.reset()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ConditionNode
// ---------------------------------------------------------------------------
describe("ConditionNode", () => {
  it("returns SUCCESS when the condition is true", () => {
    const node = new ConditionNode("check-true", () => true);
    expect(node.tick()).toBe(NodeStatus.SUCCESS);
  });

  it("returns FAILURE when the condition is false", () => {
    const node = new ConditionNode("check-false", () => false);
    expect(node.tick()).toBe(NodeStatus.FAILURE);
  });

  it("invokes the condition each tick", () => {
    const condition = jest.fn(() => true);
    const node = new ConditionNode("check-call", condition);
    node.tick();
    node.tick();
    expect(condition).toHaveBeenCalledTimes(2);
  });

  it("has a name", () => {
    const node = new ConditionNode("sensor", () => true);
    expect(node.name).toBe("sensor");
  });
});

// ---------------------------------------------------------------------------
// SequenceNode (AND logic)
// ---------------------------------------------------------------------------
describe("SequenceNode", () => {
  let successChild: ActionNode;
  let failureChild: ActionNode;
  let runningChild: ActionNode;

  beforeEach(() => {
    successChild = new ActionNode("success", () => NodeStatus.SUCCESS);
    failureChild = new ActionNode("failure", () => NodeStatus.FAILURE);
    runningChild = new ActionNode("running", () => NodeStatus.RUNNING);
  });

  it("returns SUCCESS when all children succeed", () => {
    const node = new SequenceNode("seq", [successChild, successChild]);
    expect(node.tick()).toBe(NodeStatus.SUCCESS);
  });

  it("returns FAILURE and short-circuits on first failing child", () => {
    const spy = jest.fn(() => NodeStatus.SUCCESS);
    const afterFailure = new ActionNode("never-reached", spy);
    const node = new SequenceNode("seq", [failureChild, afterFailure]);
    expect(node.tick()).toBe(NodeStatus.FAILURE);
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns RUNNING and short-circuits on first running child", () => {
    const spy = jest.fn(() => NodeStatus.SUCCESS);
    const afterRunning = new ActionNode("never-reached", spy);
    const node = new SequenceNode("seq", [runningChild, afterRunning]);
    expect(node.tick()).toBe(NodeStatus.RUNNING);
    expect(spy).not.toHaveBeenCalled();
  });

  it("reset cascades to all children", () => {
    const resetSpy1 = jest.spyOn(successChild, "reset");
    const resetSpy2 = jest.spyOn(failureChild, "reset");
    const node = new SequenceNode("seq", [successChild, failureChild]);
    node.reset();
    expect(resetSpy1).toHaveBeenCalledTimes(1);
    expect(resetSpy2).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// SelectorNode (OR logic)
// ---------------------------------------------------------------------------
describe("SelectorNode", () => {
  let successChild: ActionNode;
  let failureChild: ActionNode;
  let runningChild: ActionNode;

  beforeEach(() => {
    successChild = new ActionNode("success", () => NodeStatus.SUCCESS);
    failureChild = new ActionNode("failure", () => NodeStatus.FAILURE);
    runningChild = new ActionNode("running", () => NodeStatus.RUNNING);
  });

  it("returns FAILURE when all children fail", () => {
    const node = new SelectorNode("sel", [failureChild, failureChild]);
    expect(node.tick()).toBe(NodeStatus.FAILURE);
  });

  it("returns SUCCESS and short-circuits on first succeeding child", () => {
    const spy = jest.fn(() => NodeStatus.FAILURE);
    const afterSuccess = new ActionNode("never-reached", spy);
    const node = new SelectorNode("sel", [failureChild, successChild, afterSuccess]);
    expect(node.tick()).toBe(NodeStatus.SUCCESS);
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns RUNNING and short-circuits on first running child", () => {
    const spy = jest.fn(() => NodeStatus.SUCCESS);
    const afterRunning = new ActionNode("never-reached", spy);
    const node = new SelectorNode("sel", [runningChild, afterRunning]);
    expect(node.tick()).toBe(NodeStatus.RUNNING);
    expect(spy).not.toHaveBeenCalled();
  });

  it("reset cascades to all children", () => {
    const resetSpy1 = jest.spyOn(failureChild, "reset");
    const resetSpy2 = jest.spyOn(successChild, "reset");
    const node = new SelectorNode("sel", [failureChild, successChild]);
    node.reset();
    expect(resetSpy1).toHaveBeenCalledTimes(1);
    expect(resetSpy2).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// ParallelNode
// ---------------------------------------------------------------------------
describe("ParallelNode", () => {
  it("returns SUCCESS when successes meet the threshold", () => {
    const fail = new ActionNode("fail", () => NodeStatus.FAILURE);
    const ok = new ActionNode("ok", () => NodeStatus.SUCCESS);
    const node = new ParallelNode("par", [ok, fail], 1);
    expect(node.tick()).toBe(NodeStatus.SUCCESS);
  });

  it("returns FAILURE when threshold can never be reached", () => {
    const fail = new ActionNode("fail", () => NodeStatus.FAILURE);
    const fail2 = new ActionNode("fail2", () => NodeStatus.FAILURE);
    const node = new ParallelNode("par", [fail, fail2], 1);
    expect(node.tick()).toBe(NodeStatus.FAILURE);
  });

  it("returns RUNNING when outcome is undecided", () => {
    const ok = new ActionNode("ok", () => NodeStatus.SUCCESS);
    const running = new ActionNode("running", () => NodeStatus.RUNNING);
    const node = new ParallelNode("par", [ok, running], 2);
    expect(node.tick()).toBe(NodeStatus.RUNNING);
  });

  it("ticks all children every invocation", () => {
    const a = jest.fn(() => NodeStatus.SUCCESS);
    const b = jest.fn(() => NodeStatus.RUNNING);
    const node = new ParallelNode("par", [
      new ActionNode("a", a),
      new ActionNode("b", b),
    ], 2);
    node.tick();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("reset cascades to all children", () => {
    const a = new ActionNode("a", () => NodeStatus.SUCCESS);
    const b = new ActionNode("b", () => NodeStatus.RUNNING);
    const spyA = jest.spyOn(a, "reset");
    const spyB = jest.spyOn(b, "reset");
    const node = new ParallelNode("par", [a, b], 1);
    node.reset();
    expect(spyA).toHaveBeenCalledTimes(1);
    expect(spyB).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// RepeatNode
// ---------------------------------------------------------------------------
describe("RepeatNode", () => {
  it("repeats the child until the required count is reached then returns SUCCESS", () => {
    const child = new ActionNode("work", () => NodeStatus.SUCCESS);
    const node = new RepeatNode("repeat", child, 3);
    expect(node.tick()).toBe(NodeStatus.RUNNING);
    expect(node.tick()).toBe(NodeStatus.RUNNING);
    expect(node.tick()).toBe(NodeStatus.SUCCESS);
  });

  it("returns RUNNING forever when times is -1 (infinite)", () => {
    const child = new ActionNode("work", () => NodeStatus.SUCCESS);
    const node = new RepeatNode("infinite", child, -1);
    for (let i = 0; i < 10; i++) {
      expect(node.tick()).toBe(NodeStatus.RUNNING);
    }
  });

  it("propagates FAILURE immediately from the child", () => {
    const child = new ActionNode("fail", () => NodeStatus.FAILURE);
    const node = new RepeatNode("repeat-fail", child, 5);
    expect(node.tick()).toBe(NodeStatus.FAILURE);
  });

  it("reset clears the success counter", () => {
    const child = new ActionNode("work", () => NodeStatus.SUCCESS);
    const node = new RepeatNode("repeat", child, 2);
    node.tick();
    node.tick();
    expect(node.tick()).toBe(NodeStatus.SUCCESS);
    node.reset();
    expect(node.tick()).toBe(NodeStatus.RUNNING);
  });
});

// ---------------------------------------------------------------------------
// InverterNode
// ---------------------------------------------------------------------------
describe("InverterNode", () => {
  it("flips SUCCESS to FAILURE", () => {
    const child = new ActionNode("ok", () => NodeStatus.SUCCESS);
    const node = new InverterNode("inv", child);
    expect(node.tick()).toBe(NodeStatus.FAILURE);
  });

  it("flips FAILURE to SUCCESS", () => {
    const child = new ActionNode("err", () => NodeStatus.FAILURE);
    const node = new InverterNode("inv", child);
    expect(node.tick()).toBe(NodeStatus.SUCCESS);
  });

  it("passes RUNNING through unchanged", () => {
    const child = new ActionNode("wait", () => NodeStatus.RUNNING);
    const node = new InverterNode("inv", child);
    expect(node.tick()).toBe(NodeStatus.RUNNING);
  });

  it("reset cascades to child", () => {
    const child = new ActionNode("child", () => NodeStatus.SUCCESS);
    const spy = jest.spyOn(child, "reset");
    const node = new InverterNode("inv", child);
    node.reset();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// BehaviorTree container
// ---------------------------------------------------------------------------
describe("BehaviorTree", () => {
  it("tick delegates to the root node", () => {
    const root = new ActionNode("root", () => NodeStatus.SUCCESS);
    const tree = new BehaviorTree(root);
    expect(tree.tick()).toBe(NodeStatus.SUCCESS);
  });

  it("reset delegates to the root node", () => {
    const root = new ActionNode("root", () => NodeStatus.SUCCESS);
    const spy = jest.spyOn(root, "reset");
    const tree = new BehaviorTree(root);
    tree.reset();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// BehaviorNode abstract class
// ---------------------------------------------------------------------------
describe("BehaviorNode", () => {
  it("default reset is a no-op (not abstract)", () => {
    const node = new (class extends BehaviorNode {
      tick(): NodeStatus {
        return NodeStatus.SUCCESS;
      }
    })("concrete");
    expect(() => node.reset()).not.toThrow();
  });
});
