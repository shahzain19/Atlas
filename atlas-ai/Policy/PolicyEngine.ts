/**
 * Policy Engine - selects actions based on observations
 */
import { hashString, seededRange } from "../../atlas-kernel/utils/deterministic";

export interface Observation {
  state: Record<string, unknown>;
  timestamp: number;
}

export interface Action {
  type: string;
  params: Record<string, unknown>;
  confidence: number;
}

export abstract class Policy {
  abstract selectAction(observation: Observation): Promise<Action>;
  abstract update(reward: number): void;
}

export class EpsilonGreedyPolicy extends Policy {
  private rewardSum = 0;
  private updates = 0;

  async selectAction(observation: Observation): Promise<Action> {
    const seed = hashString(JSON.stringify(observation.state)) + observation.timestamp;
    const actions = ["move_forward", "turn_left", "turn_right", "stop"];
    const index = Math.floor(seededRange(seed, 0, actions.length));
    return {
      type: actions[index],
      params: { speed: seededRange(seed + 1, 0.1, 1) },
      confidence: seededRange(seed + 2, 0.5, 1),
    };
  }

  update(reward: number): void {
    this.rewardSum += reward;
    this.updates += 1;
  }

  getAverageReward(): number {
    return this.updates > 0 ? this.rewardSum / this.updates : 0;
  }
}

/** @deprecated Use EpsilonGreedyPolicy */
export class RandomPolicy extends EpsilonGreedyPolicy {}

export class PolicyEngine {
  private policy: Policy;

  constructor(policy: Policy) {
    this.policy = policy;
  }

  setPolicy(policy: Policy): void {
    this.policy = policy;
  }

  async act(observation: Observation): Promise<Action> {
    return this.policy.selectAction(observation);
  }

  update(reward: number): void {
    this.policy.update(reward);
  }
}
