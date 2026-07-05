/**
 * BehaviorTree.ts
 * Complete Behavior Tree implementation for the Atlas robotics platform.
 */

// ---------------------------------------------------------------------------
// Status enum
// ---------------------------------------------------------------------------

export enum NodeStatus {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  RUNNING = "RUNNING",
}

// ---------------------------------------------------------------------------
// Abstract base node
// ---------------------------------------------------------------------------

export abstract class BehaviorNode {
  constructor(public readonly name: string) {}

  abstract tick(): NodeStatus;

  /** Override in stateful nodes to reset internal state. */
  reset(): void {}
}

// ---------------------------------------------------------------------------
// Leaf nodes
// ---------------------------------------------------------------------------

export class ActionNode extends BehaviorNode {
  private readonly action: () => NodeStatus;

  constructor(name: string, action: () => NodeStatus) {
    super(name);
    this.action = action;
  }

  tick(): NodeStatus {
    return this.action();
  }
}

export class ConditionNode extends BehaviorNode {
  private readonly condition: () => boolean;

  constructor(name: string, condition: () => boolean) {
    super(name);
    this.condition = condition;
  }

  tick(): NodeStatus {
    return this.condition() ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}

// ---------------------------------------------------------------------------
// Composite nodes
// ---------------------------------------------------------------------------

/**
 * SequenceNode — AND logic.
 * Ticks children left-to-right:
 *   • Returns FAILURE immediately on the first FAILURE child.
 *   • Returns RUNNING immediately on the first RUNNING child.
 *   • Returns SUCCESS only when all children return SUCCESS.
 */
export class SequenceNode extends BehaviorNode {
  public readonly children: BehaviorNode[];

  constructor(name: string, children: BehaviorNode[]) {
    super(name);
    this.children = children;
  }

  tick(): NodeStatus {
    for (const child of this.children) {
      const status = child.tick();
      if (status === NodeStatus.FAILURE || status === NodeStatus.RUNNING) {
        return status;
      }
    }
    return NodeStatus.SUCCESS;
  }

  reset(): void {
    this.children.forEach((c) => c.reset());
  }
}

/**
 * SelectorNode — OR logic.
 * Ticks children left-to-right:
 *   • Returns SUCCESS immediately on the first SUCCESS child.
 *   • Returns RUNNING immediately on the first RUNNING child.
 *   • Returns FAILURE only when all children return FAILURE.
 */
export class SelectorNode extends BehaviorNode {
  public readonly children: BehaviorNode[];

  constructor(name: string, children: BehaviorNode[]) {
    super(name);
    this.children = children;
  }

  tick(): NodeStatus {
    for (const child of this.children) {
      const status = child.tick();
      if (status === NodeStatus.SUCCESS || status === NodeStatus.RUNNING) {
        return status;
      }
    }
    return NodeStatus.FAILURE;
  }

  reset(): void {
    this.children.forEach((c) => c.reset());
  }
}

/**
 * ParallelNode — ticks ALL children every tick.
 *   • Returns SUCCESS if the number of successful children >= successThreshold.
 *   • Returns FAILURE if it's impossible to ever reach successThreshold
 *     (i.e., failures > children.length - successThreshold).
 *   • Returns RUNNING otherwise.
 */
export class ParallelNode extends BehaviorNode {
  public readonly children: BehaviorNode[];
  public readonly successThreshold: number;

  constructor(name: string, children: BehaviorNode[], successThreshold: number) {
    super(name);
    this.children = children;
    this.successThreshold = successThreshold;
  }

  tick(): NodeStatus {
    let successes = 0;
    let failures = 0;

    for (const child of this.children) {
      const status = child.tick();
      if (status === NodeStatus.SUCCESS) successes++;
      else if (status === NodeStatus.FAILURE) failures++;
    }

    if (successes >= this.successThreshold) {
      return NodeStatus.SUCCESS;
    }

    const maxPossibleSuccesses = this.children.length - failures;
    if (maxPossibleSuccesses < this.successThreshold) {
      return NodeStatus.FAILURE;
    }

    return NodeStatus.RUNNING;
  }

  reset(): void {
    this.children.forEach((c) => c.reset());
  }
}

// ---------------------------------------------------------------------------
// Decorator nodes
// ---------------------------------------------------------------------------

/**
 * RepeatNode — repeats its child until it has succeeded `times` times.
 *   • times = -1 → infinite repetition (always returns RUNNING).
 *   • Returns RUNNING while the repeat count has not been reached.
 *   • Returns SUCCESS once the child has succeeded `times` times.
 *   • Returns FAILURE immediately if the child returns FAILURE.
 */
export class RepeatNode extends BehaviorNode {
  private readonly child: BehaviorNode;
  private readonly times: number;
  private successCount: number = 0;

  constructor(name: string, child: BehaviorNode, times: number) {
    super(name);
    this.child = child;
    this.times = times;
  }

  tick(): NodeStatus {
    const status = this.child.tick();

    if (status === NodeStatus.FAILURE) {
      return NodeStatus.FAILURE;
    }

    if (status === NodeStatus.SUCCESS) {
      // Infinite mode — never complete
      if (this.times === -1) {
        return NodeStatus.RUNNING;
      }

      this.successCount++;
      if (this.successCount >= this.times) {
        return NodeStatus.SUCCESS;
      }
    }

    return NodeStatus.RUNNING;
  }

  reset(): void {
    this.successCount = 0;
    this.child.reset();
  }
}

/**
 * InverterNode — flips SUCCESS ↔ FAILURE; RUNNING passes through unchanged.
 */
export class InverterNode extends BehaviorNode {
  private readonly child: BehaviorNode;

  constructor(name: string, child: BehaviorNode) {
    super(name);
    this.child = child;
  }

  tick(): NodeStatus {
    const status = this.child.tick();
    if (status === NodeStatus.SUCCESS) return NodeStatus.FAILURE;
    if (status === NodeStatus.FAILURE) return NodeStatus.SUCCESS;
    return NodeStatus.RUNNING;
  }

  reset(): void {
    this.child.reset();
  }
}

// ---------------------------------------------------------------------------
// Root container
// ---------------------------------------------------------------------------

/**
 * BehaviorTree — wraps a root BehaviorNode and provides tick / reset.
 */
export class BehaviorTree {
  private readonly root: BehaviorNode;

  constructor(root: BehaviorNode) {
    this.root = root;
  }

  tick(): NodeStatus {
    return this.root.tick();
  }

  /** Recursively resets all node states in the tree. */
  reset(): void {
    this.root.reset();
  }
}
