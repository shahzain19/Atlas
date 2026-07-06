import { GroqClient } from "../../atlas-kernel/Groq/GroqClient";

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
  private groq: GroqClient;
  private rewardSum = 0;
  private updates = 0;

  constructor() {
    super();
    this.groq = GroqClient.getInstance();
  }

  async selectAction(observation: Observation): Promise<Action> {
    const context = JSON.stringify(observation.state);
    const actions = ["move_forward", "turn_left", "turn_right", "stop", "scan", "return"];

    const result = await this.groq.decide(context, actions);

    return {
      type: result.action,
      params: { speed: Math.random() * 0.5 + 0.5 },
      confidence: result.confidence,
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
