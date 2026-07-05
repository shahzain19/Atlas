import { EventBus } from "../../atlas-kernel/Event/EventBus";
import { Event, EventPriority } from "../../atlas-kernel/Event/Event";
import { AgentMessage, AgentSignal } from "../../atlas-kernel/Communication/AgentMessage";
import { FleetTelemetry, FleetNode } from "../Telemetry/FleetTelemetry";

/**
 * Represents a mission assigned to fleet nodes.
 */
export interface FleetMission {
  id: string;
  name: string;
  tasks: MissionTask[];
  assignedNodes: string[];
  status: "pending" | "in_progress" | "completed" | "failed";
  priority: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * A task within a mission.
 */
export interface MissionTask {
  id: string;
  description: string;
  assignedNode?: string;
  status: "pending" | "assigned" | "in_progress" | "completed" | "failed";
  dependencies: string[];
}

/**
 * Result of a consensus operation.
 */
export interface ConsensusResult {
  success: boolean;
  votes: Map<string, boolean>;
  agreed: boolean;
  timestamp: number;
}

/**
 * FleetCoordinator manages coordination of multiple fleet nodes.
 * Handles mission assignment, node failure management, and consensus building.
 */
export class FleetCoordinator {
  /** Map of node IDs to FleetNode instances */
  nodes: Map<string, FleetNode> = new Map();

  /** Map of mission IDs to FleetMission instances */
  missions: Map<string, FleetMission> = new Map();

  /** Number of nodes required to reach consensus (default: majority) */
  consensusThreshold: number = 0.5;

  /** EventBus for publishing events */
  private eventBus: EventBus;

  /** FleetTelemetry for node management */
  private telemetry: FleetTelemetry;

  constructor(eventBus?: EventBus, telemetry?: FleetTelemetry) {
    this.eventBus = eventBus || new EventBus();
    this.telemetry = telemetry || new FleetTelemetry(this.eventBus);
  }

  /**
   * Coordinates a mission across multiple nodes.
   * @param mission - The mission to coordinate
   * @returns The coordinated mission
   */
  coordinateMission(mission: FleetMission): FleetMission {
    mission.status = "in_progress";
    mission.updatedAt = Date.now();

    // Assign tasks to nodes based on capability
    for (const task of mission.tasks) {
      if (!task.assignedNode) {
        const suitableNode = this.findSuitableNode(task);
        if (suitableNode) {
          task.assignedNode = suitableNode.id;
          task.status = "assigned";
        }
      }
    }

    this.missions.set(mission.id, mission);

    this.eventBus.emit({
      type: "fleet:mission:started",
      source: "coordinator",
      payload: { missionId: mission.id, missionName: mission.name },
      timestamp: Date.now(),
      priority: EventPriority.HIGH,
    });

    return mission;
  }

  /**
   * Assigns a specific task to a node.
   * @param missionId - The mission ID
   * @param taskId - The task ID
   * @param nodeId - The node to assign the task to
   * @returns The updated mission or undefined if not found
   */
  assignTask(missionId: string, taskId: string, nodeId: string): FleetMission | undefined {
    const mission = this.missions.get(missionId);
    if (!mission) return undefined;

    const task = mission.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;

    task.assignedNode = nodeId;
    task.status = "assigned";
    mission.updatedAt = Date.now();

    this.eventBus.emit({
      type: "fleet:task:assigned",
      source: "coordinator",
      payload: { missionId, taskId, nodeId },
      timestamp: Date.now(),
      priority: EventPriority.MEDIUM,
    });

    return mission;
  }

  /**
   * Handles node failure by reassigning tasks and notifying the fleet.
   * @param nodeId - The failed node ID
   * @returns The handling result
   */
  handleNodeFailure(nodeId: string): { reassigned: number; failed: number } {
    const failedNode = this.nodes.get(nodeId);
    let reassigned = 0;
    let failed = 0;

    if (failedNode) {
      failedNode.status = "error";
      this.eventBus.emit({
        type: "fleet:node:failed",
        source: nodeId,
        payload: { nodeId, nodeName: failedNode.name },
        timestamp: Date.now(),
        priority: EventPriority.CRITICAL,
      });
    }

    // Reassign tasks from failed node
    for (const mission of this.missions.values()) {
      if (mission.status === "in_progress") {
        for (const task of mission.tasks) {
          if (task.assignedNode === nodeId && task.status !== "completed") {
            const newNode = this.findSuitableNode(task);
            if (newNode) {
              task.assignedNode = newNode.id;
              task.status = "assigned";
              reassigned++;
            } else {
              task.status = "failed";
              failed++;
            }
          }
        }
        mission.updatedAt = Date.now();
      }
    }

    if (reassigned > 0 || failed > 0) {
      this.eventBus.emit({
        type: "fleet:tasks:reassigned",
        source: "coordinator",
        payload: { failedNodeId: nodeId, reassigned, failed },
        timestamp: Date.now(),
        priority: EventPriority.HIGH,
      });
    }

    return { reassigned, failed };
  }

  /**
   * Reaches consensus among fleet nodes on a decision.
   * @param proposal - The proposal to vote on
   * @param nodeIds - Nodes to include in consensus
   * @returns Consensus result
   */
  async consensus(proposal: string, nodeIds?: string[]): Promise<ConsensusResult> {
    const targetNodes = nodeIds || Array.from(this.nodes.values()).map((n) => n.id);
    const votes = new Map<string, boolean>();

    // Simulate voting (in real implementation, would wait for actual node responses)
    for (const nodeId of targetNodes) {
      const node = this.nodes.get(nodeId);
      if (node && node.status === "online") {
        // Simple consensus: vote based on node health
        votes.set(nodeId, node.health.overall > 0.5);
      }
    }

    const positiveVotes = Array.from(votes.values()).filter((v) => v).length;
    const threshold = Math.ceil(targetNodes.length * this.consensusThreshold);
    const agreed = positiveVotes >= threshold;

    const result: ConsensusResult = {
      success: agreed,
      votes,
      agreed,
      timestamp: Date.now(),
    };

    this.eventBus.emit({
      type: "fleet:consensus:result",
      source: "coordinator",
      payload: { proposal, result },
      timestamp: Date.now(),
      priority: EventPriority.HIGH,
    });

    return result;
  }

  /**
   * Registers a node with the coordinator.
   * @param node - The node to register
   */
  registerNode(node: FleetNode): void {
    this.nodes.set(node.id, node);
    this.telemetry.registerNode(node);
  }

  /**
   * Unregisters a node from the coordinator.
   * @param nodeId - The node ID to unregister
   */
  unregisterNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.telemetry.unregisterNode(nodeId);
  }

  /**
   * Finds a suitable node for a task based on status and health.
   * @param task - The task to find a node for
   * @returns Suitable node or undefined
   */
  private findSuitableNode(task: MissionTask): FleetNode | undefined {
    const availableNodes = Array.from(this.nodes.values()).filter(
      (node) => node.status === "online" && node.health.overall > 0.3
    );

    // Sort by health (highest first) and then by battery
    availableNodes.sort((a, b) => {
      if (b.health.overall !== a.health.overall) {
        return b.health.overall - a.health.overall;
      }
      return b.health.battery - a.health.battery;
    });

    return availableNodes[0];
  }

  /**
   * Gets mission status.
   * @param missionId - The mission ID
   * @returns Mission or undefined
   */
  getMission(missionId: string): FleetMission | undefined {
    return this.missions.get(missionId);
  }

  /**
   * Gets all missions.
   * @returns Array of all missions
   */
  getAllMissions(): FleetMission[] {
    return Array.from(this.missions.values());
  }

  /**
   * Creates a new mission.
   * @param mission - The mission to create
   * @returns The created mission
   */
  createMission(mission: FleetMission): FleetMission {
    mission.status = "pending";
    mission.createdAt = Date.now();
    mission.updatedAt = Date.now();
    this.missions.set(mission.id, mission);
    return mission;
  }

  /**
   * Updates mission status.
   * @param missionId - The mission ID
   * @param status - The new status
   */
  updateMissionStatus(missionId: string, status: FleetMission["status"]): void {
    const mission = this.missions.get(missionId);
    if (mission) {
      mission.status = status;
      mission.updatedAt = Date.now();
    }
  }

  /**
   * Sends a message to a node or broadcasts to all.
   * @param message - The message to send
   * @returns The message with timestamp
   */
  sendMessage(message: Omit<AgentMessage, "id" | "timestamp">): AgentMessage {
    const fullMessage: AgentMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.eventBus.emit({
      type: "fleet:message:sent",
      source: fullMessage.sender,
      payload: fullMessage,
      timestamp: Date.now(),
      priority: EventPriority.MEDIUM,
    });

    return fullMessage;
  }
}