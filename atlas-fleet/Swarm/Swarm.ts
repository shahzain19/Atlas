import { EventBus } from "../../atlas-kernel/Event/EventBus";
import { Event, EventPriority } from "../../atlas-kernel/Event/Event";
import { AgentRegistry } from "../../atlas-agents/AgentRegistry/AgentRegistry";
import { AgentMessage, AgentSignal } from "../../atlas-kernel/Communication/AgentMessage";
import { FleetTelemetry, FleetNode } from "../Telemetry/FleetTelemetry";

/**
 * Represents a signal sent between swarm agents.
 */
export interface SwarmSignal {
  id: string;
  type: "INFO" | "ALERT" | "REQUEST" | "RESPONSE" | "SYNC";
  sourceNode: string;
  targetNodes: string[];
  payload: Record<string, unknown>;
  timestamp: number;
}

/**
 * Predefined swarm behavior patterns.
 */
export enum SwarmBehaviorPattern {
  FORMATION = "formation",
  SEARCH = "search",
  FOLLOW = "follow",
  EXPLORE = "explore",
  GATHER = "gather",
  DISPERSED = "dispersed",
  DEFENSIVE = "defensive",
}

/**
 * Active swarm behavior with its parameters.
 */
export interface SwarmBehavior {
  pattern: SwarmBehaviorPattern;
  parameters: Record<string, unknown>;
  active: boolean;
  startedAt: number;
}

/**
 * Result of a swarm consensus operation.
 */
export interface SwarmConsensusResult {
  success: boolean;
  agreeingNodes: number;
  totalNodes: number;
  consensus: number;
}

/**
 * Swarm enables swarm intelligence for coordinated multi-node operations.
 * Provides methods for broadcasting signals, reaching consensus, and executing
 * swarm behavior patterns.
 */
export class Swarm {
  /** Map of agent IDs to their instances */
  agents: Map<string, unknown> = new Map();

  /** Array of received signals */
  signals: SwarmSignal[] = [];

  /** Active behavior patterns */
  behaviorPatterns: Map<string, SwarmBehavior> = new Map();

  /** Agent registry for routing messages */
  private agentRegistry: AgentRegistry;

  /** EventBus for publishing events */
  private eventBus: EventBus;

  /** FleetTelemetry for node tracking */
  private telemetry: FleetTelemetry;

  constructor(
    agentRegistry?: AgentRegistry,
    telemetry?: FleetTelemetry,
    eventBus?: EventBus
  ) {
    this.agentRegistry = agentRegistry || new AgentRegistry();
    this.telemetry = telemetry || new FleetTelemetry();
    this.eventBus = eventBus || new EventBus();
  }

  /**
   * Broadcasts a signal to multiple nodes.
   * @param signal - The signal to broadcast
   * @returns The broadcast signal
   */
  broadcastSignal(signal: Omit<SwarmSignal, "id" | "timestamp">): SwarmSignal {
    const fullSignal: SwarmSignal = {
      ...signal,
      id: `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.signals.push(fullSignal);

    this.eventBus.emit({
      type: "swarm:signal:broadcast",
      source: fullSignal.sourceNode,
      payload: fullSignal,
      timestamp: fullSignal.timestamp,
      priority: signal.type === "ALERT" ? EventPriority.CRITICAL : EventPriority.HIGH,
    });

    return fullSignal;
  }

  /**
   * Receives and processes a signal from another node.
   * @param signal - The signal to receive
   * @returns The processed signal
   */
  receiveSignal(signal: SwarmSignal): SwarmSignal {
    signal.timestamp = Date.now();
    this.signals.push(signal);

    this.eventBus.emit({
      type: "swarm:signal:received",
      source: signal.sourceNode,
      payload: signal,
      timestamp: signal.timestamp,
      priority: signal.type === "ALERT" ? EventPriority.CRITICAL : EventPriority.MEDIUM,
    });

    return signal;
  }

  /**
   * Forms consensus among swarm nodes on a decision.
   * @param proposal - The proposal to vote on
   * @param nodeIds - Nodes to include in consensus
   * @returns Consensus result
   */
  async formConsensus(proposal: string, nodeIds?: string[]): Promise<SwarmConsensusResult> {
    const nodes = this.telemetry.getNodeStatus() as FleetNode[];
    const targetNodes = nodeIds || nodes.map((n) => n.id);

    let agreeingNodes = 0;
    const totalNodes = targetNodes.length;

    // Count nodes that agree (based on health for simplicity)
    for (const nodeId of targetNodes) {
      const node = nodes.find((n) => n.id === nodeId);
      if (node && node.status === "online" && node.health.overall > 0.5) {
        agreeingNodes++;
      }
    }

    const consensus = totalNodes > 0 ? agreeingNodes / totalNodes : 0;
    const success = consensus >= 0.5;

    const result: SwarmConsensusResult = {
      success,
      agreeingNodes,
      totalNodes,
      consensus,
    };

    this.eventBus.emit({
      type: "swarm:consensus",
      source: "swarm",
      payload: { proposal, result },
      timestamp: Date.now(),
      priority: EventPriority.HIGH,
    });

    return result;
  }

  /**
   * Executes a swarm behavior pattern.
   * @param pattern - The behavior pattern to execute
   * @param parameters - Parameters for the behavior
   * @returns The active behavior
   */
  executeSwarmBehavior(
    pattern: SwarmBehaviorPattern,
    parameters: Record<string, unknown> = {}
  ): SwarmBehavior {
    const behavior: SwarmBehavior = {
      pattern,
      parameters,
      active: true,
      startedAt: Date.now(),
    };

    const behaviorId = `behavior-${pattern}-${Date.now()}`;
    this.behaviorPatterns.set(behaviorId, behavior);

    const nodes = this.telemetry.getNodeStatus() as FleetNode[];

    this.eventBus.emit({
      type: "swarm:behavior:started",
      source: "swarm",
      payload: { behaviorId, pattern, nodeCount: nodes.length, parameters },
      timestamp: Date.now(),
      priority: EventPriority.HIGH,
    });

    // Broadcast behavior start to all nodes
    this.broadcastSignal({
      type: "SYNC",
      sourceNode: "swarm",
      targetNodes: nodes.map((n) => n.id),
      payload: { behavior: pattern, parameters },
    });

    return behavior;
  }

  /**
   * Stops an active swarm behavior.
   * @param pattern - The behavior pattern to stop
   */
  stopSwarmBehavior(pattern: SwarmBehaviorPattern): void {
    for (const [behaviorId, behavior] of this.behaviorPatterns.entries()) {
      if (behavior.pattern === pattern) {
        behavior.active = false;
        this.behaviorPatterns.delete(behaviorId);

        this.eventBus.emit({
          type: "swarm:behavior:stopped",
          source: "swarm",
          payload: { behaviorId, pattern },
          timestamp: Date.now(),
          priority: EventPriority.MEDIUM,
        });
      }
    }
  }

  /**
   * Registers an agent with the swarm.
   * @param agentId - The agent ID
   * @param agent - The agent instance
   */
  registerAgent(agentId: string, agent: unknown): void {
    this.agents.set(agentId, agent);
    if (this.agentRegistry) {
      // Note: Would need proper agent type casting in real implementation
    }
  }

  /**
   * Unregisters an agent from the swarm.
   * @param agentId - The agent ID to unregister
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
  }

  /**
   * Gets all active signals.
   * @returns Array of signals
   */
  getSignals(): SwarmSignal[] {
    return this.signals;
  }

  /**
   * Gets active behaviors.
   * @returns Array of active behaviors
   */
  getActiveBehaviors(): SwarmBehavior[] {
    return Array.from(this.behaviorPatterns.values()).filter((b) => b.active);
  }

  /**
   * Gets all registered agent IDs.
   * @returns Array of agent IDs
   */
  getAgentIds(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Gets swarm statistics.
   * @returns Object with swarm statistics
   */
  getStats(): {
    agentCount: number;
    signalCount: number;
    activeBehaviors: number;
    nodeCount: number;
  } {
    const nodes = this.telemetry.getNodeStatus() as FleetNode[];
    return {
      agentCount: this.agents.size,
      signalCount: this.signals.length,
      activeBehaviors: this.getActiveBehaviors().length,
      nodeCount: nodes.length,
    };
  }
}