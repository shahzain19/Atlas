import { EventBus } from "../../atlas-kernel/Event/EventBus";
import { Event, EventPriority } from "../../atlas-kernel/Event/Event";

/**
 * Represents a tracked node in the runtime system.
 */
export interface TrackedNode {
  nodeId: string;
  nodeName: string;
  status: "online" | "offline" | "busy" | "error" | "initializing";
  lastSeen: number;
  metrics: NodeMetrics;
  metadata?: Record<string, unknown>;
}

/**
 * Runtime metrics for a node.
 */
export interface NodeMetrics {
  cpu: number;
  memory: number;
  battery: number;
  latency: number;
  throughput: number;
  errorRate: number;
}

/**
 * Telemetry buffer entry for historical data.
 */
export interface TelemetryBufferEntry {
  nodeId: string;
  timestamp: number;
  metrics: NodeMetrics;
}

/**
 * FleetTelemetry handles runtime integration for fleet telemetry tracking.
 * Provides methods for tracking nodes, retrieving telemetry, and exporting data.
 */
export class FleetTelemetry {
  /** Map of node IDs to tracked nodes */
  nodeTracker: Map<string, TrackedNode> = new Map();

  /** Circular buffer for telemetry data */
  telemetryBuffer: TelemetryBufferEntry[] = [];

  /** Maximum buffer size (default: 1000 entries) */
  private maxBufferSize: number = 1000;

  /** EventBus for publishing events */
  private eventBus: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
  }

  /**
   * Tracks a new node or updates an existing node.
   * @param node - The node to track
   * @returns The tracked node
   */
  trackNode(node: Omit<TrackedNode, "lastSeen">): TrackedNode {
    const now = Date.now();
    const tracked: TrackedNode = {
      ...node,
      lastSeen: now,
    };

    const existing = this.nodeTracker.get(node.nodeId);
    this.nodeTracker.set(node.nodeId, tracked);

    if (existing) {
      this.eventBus.emit({
        type: "runtime:node:updated",
        source: node.nodeId,
        payload: tracked,
        timestamp: now,
        priority: EventPriority.LOW,
      });
    } else {
      this.eventBus.emit({
        type: "runtime:node:tracked",
        source: node.nodeId,
        payload: tracked,
        timestamp: now,
        priority: EventPriority.MEDIUM,
      });
    }

    return tracked;
  }

  /**
   * Gets telemetry data for a specific node.
   * @param nodeId - The node ID
   * @returns Telemetry data or undefined if node not found
   */
  getTelemetry(nodeId: string): TrackedNode | undefined {
    const node = this.nodeTracker.get(nodeId);
    if (node) {
      node.lastSeen = Date.now();
    }
    return node;
  }

  /**
   * Gets all telemetry data.
   * @returns Array of all tracked nodes
   */
  getAllTelemetry(): TrackedNode[] {
    const now = Date.now();
    const updatedNodes: TrackedNode[] = [];

    for (const node of this.nodeTracker.values()) {
      // Update lastSeen for all nodes
      const updated = { ...node, lastSeen: now };
      updatedNodes.push(updated);
    }

    return updatedNodes;
  }

  /**
   * Exports telemetry data in a specified format.
   * @param format - Export format ("json" | "csv")
   * @param nodeId - Optional node ID to export specific node
   * @returns Exported telemetry data as string
   */
  exportTelemetry(
    format: "json" | "csv" = "json",
    nodeId?: string
  ): string {
    const nodes = nodeId
      ? [this.nodeTracker.get(nodeId)].filter((n): n is TrackedNode => n !== undefined)
      : Array.from(this.nodeTracker.values());

    if (format === "json") {
      const exportData = {
        timestamp: Date.now(),
        nodeCount: nodes.length,
        nodes: nodes.map((n) => ({
          nodeId: n.nodeId,
          nodeName: n.nodeName,
          status: n.status,
          lastSeen: n.lastSeen,
          metrics: n.metrics,
          metadata: n.metadata,
        })),
      };
      return JSON.stringify(exportData, null, 2);
    }

    if (format === "csv") {
      const headers = ["nodeId", "nodeName", "status", "lastSeen", "cpu", "memory", "battery", "latency", "throughput", "errorRate"];
      const rows = nodes.map((n) => [
        n.nodeId,
        n.nodeName,
        n.status,
        n.lastSeen.toString(),
        n.metrics.cpu.toString(),
        n.metrics.memory.toString(),
        n.metrics.battery.toString(),
        n.metrics.latency.toString(),
        n.metrics.throughput.toString(),
        n.metrics.errorRate.toString(),
      ]);
      return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    return "";
  }

  /**
   * Removes a node from tracking.
   * @param nodeId - The node ID to untrack
   */
  untrackNode(nodeId: string): void {
    const node = this.nodeTracker.get(nodeId);
    if (node) {
      this.nodeTracker.delete(nodeId);
      this.eventBus.emit({
        type: "runtime:node:untracked",
        source: nodeId,
        payload: { nodeId },
        timestamp: Date.now(),
        priority: EventPriority.MEDIUM,
      });
    }
  }

  /**
   * Updates the metrics for a node.
   * @param nodeId - The node ID
   * @param metrics - The new metrics
   */
  updateMetrics(nodeId: string, metrics: Partial<NodeMetrics>): void {
    const node = this.nodeTracker.get(nodeId);
    if (node) {
      node.metrics = { ...node.metrics, ...metrics };
      node.lastSeen = Date.now();
      this.addToBuffer(nodeId, node.metrics);
    }
  }

  /**
   * Adds a metrics entry to the telemetry buffer.
   * @param nodeId - The node ID
   * @param metrics - The metrics to buffer
   */
  private addToBuffer(nodeId: string, metrics: NodeMetrics): void {
    const entry: TelemetryBufferEntry = {
      nodeId,
      timestamp: Date.now(),
      metrics,
    };

    this.telemetryBuffer.push(entry);

    // Maintain circular buffer size
    if (this.telemetryBuffer.length > this.maxBufferSize) {
      this.telemetryBuffer.shift();
    }
  }

  /**
   * Gets buffered telemetry data for a node.
   * @param nodeId - The node ID
   * @param limit - Maximum entries to return
   * @returns Array of buffered entries
   */
  getBufferedTelemetry(nodeId: string, limit: number = 100): TelemetryBufferEntry[] {
    return this.telemetryBuffer
      .filter((entry) => entry.nodeId === nodeId)
      .slice(-limit);
  }

  /**
   * Gets the health status of all nodes.
   * @returns Map of node IDs to health status
   */
  getNodeHealthStatus(): Map<string, "healthy" | "degraded" | "critical"> {
    const healthMap = new Map<string, "healthy" | "degraded" | "critical">();

    for (const node of this.nodeTracker.values()) {
      if (node.metrics.errorRate > 0.1 || node.metrics.cpu > 0.9) {
        healthMap.set(node.nodeId, "critical");
      } else if (node.metrics.cpu > 0.7 || node.metrics.errorRate > 0.05) {
        healthMap.set(node.nodeId, "degraded");
      } else {
        healthMap.set(node.nodeId, "healthy");
      }
    }

    return healthMap;
  }

  /**
   * Sets the maximum buffer size.
   * @param size - The new maximum size
   */
  setMaxBufferSize(size: number): void {
    this.maxBufferSize = size;
    while (this.telemetryBuffer.length > this.maxBufferSize) {
      this.telemetryBuffer.shift();
    }
  }

  /**
   * Gets a count of nodes by status.
   * @returns Object with status counts
   */
  getNodeStatusCounts(): Record<string, number> {
    const counts: Record<string, number> = {
      online: 0,
      offline: 0,
      busy: 0,
      error: 0,
      initializing: 0,
    };

    for (const node of this.nodeTracker.values()) {
      counts[node.status] = (counts[node.status] || 0) + 1;
    }

    return counts;
  }

  /**
   * Clears all telemetry data.
   */
  clear(): void {
    this.nodeTracker.clear();
    this.telemetryBuffer = [];
  }
}