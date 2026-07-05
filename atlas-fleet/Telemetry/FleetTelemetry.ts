import { EventBus } from "../../atlas-kernel/Event/EventBus";
import { Event, EventPriority } from "../../atlas-kernel/Event/Event";
import { AgentMessage } from "../../atlas-kernel/Communication/AgentMessage";

/**
 * Represents a node in the fleet with its current state and health information.
 */
export interface FleetNode {
  id: string;
  name: string;
  status: "online" | "offline" | "busy" | "error";
  position?: { x: number; y: number; z: number };
  health: {
    battery: number;
    cpu: number;
    memory: number;
    overall: number;
  };
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Telemetry data for a node broadcast.
 */
export interface TelemetryData {
  nodeId: string;
  nodeName: string;
  position?: { x: number; y: number; z: number };
  health: FleetNode["health"];
  timestamp: number;
}

/**
 * FleetTelemetry manages multi-node coordination and telemetry synchronization.
 * Provides methods for registering/unregistering nodes, broadcasting telemetry,
 * and synchronizing state across the fleet.
 */
export class FleetTelemetry {
  /** Map of node IDs to FleetNode instances */
  nodes: Map<string, FleetNode> = new Map();

  /** Sync interval in milliseconds (default: 1000ms) */
  syncInterval: number = 1000;

  /** Timestamp of the last synchronization */
  lastSync: number = 0;

  /** EventBus instance for publishing events */
  private eventBus: EventBus;

  /** Interval ID for periodic sync */
  private syncTimer?: NodeJS.Timeout;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
  }

  /**
   * Registers a new node in the fleet.
   * @param node - The node to register
   */
  registerNode(node: FleetNode): void {
    this.nodes.set(node.id, node);
    this.eventBus.emit({
      type: "fleet:node:registered",
      source: node.id,
      payload: { nodeId: node.id, nodeName: node.name },
      timestamp: Date.now(),
      priority: EventPriority.MEDIUM,
    });
  }

  /**
   * Unregisters a node from the fleet.
   * @param nodeId - The ID of the node to unregister
   */
  unregisterNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.nodes.delete(nodeId);
      this.eventBus.emit({
        type: "fleet:node:unregistered",
        source: nodeId,
        payload: { nodeId },
        timestamp: Date.now(),
        priority: EventPriority.MEDIUM,
      });
    }
  }

  /**
   * Broadcasts telemetry data from a node to the fleet.
   * @param data - The telemetry data to broadcast
   */
  broadcastTelemetry(data: TelemetryData): void {
    const node = this.nodes.get(data.nodeId);
    if (node) {
      // Update local node state
      node.position = data.position;
      node.health = data.health;
      node.timestamp = data.timestamp;

      this.eventBus.emit({
        type: "fleet:telemetry:broadcast",
        source: data.nodeId,
        payload: data,
        timestamp: data.timestamp,
        priority: EventPriority.HIGH,
      });
    }
  }

  /**
   * Gets the current status of all nodes or a specific node.
   * @param nodeId - Optional node ID to get status for specific node
   * @returns Array of nodes or single node if ID provided
   */
  getNodeStatus(nodeId?: string): FleetNode[] | FleetNode | undefined {
    if (nodeId) {
      return this.nodes.get(nodeId);
    }
    return Array.from(this.nodes.values());
  }

  /**
   * Synchronizes state across all nodes in the fleet.
   * @returns Promise that resolves when sync is complete
   */
  async syncAllNodes(): Promise<FleetNode[]> {
    const allNodes = Array.from(this.nodes.values());
    const syncData: TelemetryData[] = allNodes.map((node) => ({
      nodeId: node.id,
      nodeName: node.name,
      position: node.position,
      health: node.health,
      timestamp: node.timestamp,
    }));

    this.lastSync = Date.now();

    this.eventBus.emit({
      type: "fleet:sync",
      source: "fleet",
      payload: { nodes: syncData, timestamp: this.lastSync },
      timestamp: this.lastSync,
      priority: EventPriority.HIGH,
    });

    return allNodes;
  }

  /**
   * Updates the health status of a node.
   * @param nodeId - The node ID
   * @param health - The new health data
   */
  updateNodeHealth(nodeId: string, health: FleetNode["health"]): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.health = health;
      node.timestamp = Date.now();
    }
  }

  /**
   * Updates the position of a node.
   * @param nodeId - The node ID
   * @param position - The new position
   */
  updateNodePosition(nodeId: string, position: { x: number; y: number; z: number }): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.position = position;
      node.timestamp = Date.now();
    }
  }

  /**
   * Starts periodic synchronization of all nodes.
   * @param interval - Sync interval in milliseconds
   */
  startPeriodicSync(interval?: number): void {
    if (interval) {
      this.syncInterval = interval;
    }
    this.stopPeriodicSync();
    this.syncTimer = setInterval(() => {
      this.syncAllNodes();
    }, this.syncInterval);
  }

  /**
   * Stops periodic synchronization.
   */
  stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  /**
   * Gets a count of nodes by status.
   * @returns Map of status to count
   */
  getNodeCountByStatus(): Map<string, number> {
    const countMap = new Map<string, number>();
    for (const node of this.nodes.values()) {
      const count = countMap.get(node.status) || 0;
      countMap.set(node.status, count + 1);
    }
    return countMap;
  }

  /**
   * Gets the overall fleet health (average of all nodes).
   * @returns Overall fleet health percentage
   */
  getFleetHealth(): number {
    const nodes = Array.from(this.nodes.values());
    if (nodes.length === 0) return 0;

    const totalHealth = nodes.reduce((sum, node) => sum + node.health.overall, 0);
    return totalHealth / nodes.length;
  }
}