import { FleetTelemetry, FleetNode, TelemetryData } from "../../atlas-fleet/Telemetry/FleetTelemetry";
import { EventBus } from "../../atlas-kernel/Event/EventBus";
import { jest } from "@jest/globals";

describe("FleetTelemetry", () => {
  let telemetry: FleetTelemetry;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    telemetry = new FleetTelemetry(eventBus);
  });

  describe("registerNode", () => {
    it("should register a node successfully", () => {
      const node: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        position: { x: 0, y: 0, z: 0 },
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      telemetry.registerNode(node);

      const result = telemetry.getNodeStatus("node-1");
      expect(result).toBeDefined();
      expect((result as FleetNode).id).toBe("node-1");
      expect((result as FleetNode).name).toBe("Atlas-Node-1");
    });

    it("should emit event when node is registered", () => {
      const node: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      const eventHandler = jest.fn();
      eventBus.on("fleet:node:registered", eventHandler);

      telemetry.registerNode(node);

      expect(eventHandler).toHaveBeenCalledTimes(1);
    });

    it("should allow registering multiple nodes", () => {
      const node1: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      const node2: FleetNode = {
        id: "node-2",
        name: "Atlas-Node-2",
        status: "online",
        health: { battery: 0.9, cpu: 0.2, memory: 0.3, overall: 0.93 },
        timestamp: Date.now(),
      };

      telemetry.registerNode(node1);
      telemetry.registerNode(node2);

      const allNodes = telemetry.getNodeStatus() as FleetNode[];
      expect(allNodes).toHaveLength(2);
    });
  });

  describe("unregisterNode", () => {
    it("should unregister a node successfully", () => {
      const node: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      telemetry.registerNode(node);
      telemetry.unregisterNode("node-1");

      const result = telemetry.getNodeStatus("node-1");
      expect(result).toBeUndefined();
    });

    it("should emit event when node is unregistered", () => {
      const node: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      const eventHandler = jest.fn();
      eventBus.on("fleet:node:unregistered", eventHandler);

      telemetry.registerNode(node);
      telemetry.unregisterNode("node-1");

      expect(eventHandler).toHaveBeenCalledTimes(1);
    });

    it("should not throw when unregistering non-existent node", () => {
      expect(() => telemetry.unregisterNode("non-existent")).not.toThrow();
    });
  });

  describe("broadcastTelemetry", () => {
    it("should broadcast telemetry and update node state", () => {
      const node: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        position: { x: 0, y: 0, z: 0 },
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      telemetry.registerNode(node);

      const telemetryData: TelemetryData = {
        nodeId: "node-1",
        nodeName: "Atlas-Node-1",
        position: { x: 10, y: 20, z: 0 },
        health: { battery: 0.7, cpu: 0.4, memory: 0.5, overall: 0.73 },
        timestamp: Date.now(),
      };

      const eventHandler = jest.fn();
      eventBus.on("fleet:telemetry:broadcast", eventHandler);

      telemetry.broadcastTelemetry(telemetryData);

      const updatedNode = telemetry.getNodeStatus("node-1") as FleetNode;
      expect(updatedNode.position).toEqual({ x: 10, y: 20, z: 0 });
      expect(updatedNode.health.overall).toBe(0.73);
      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe("getNodeStatus", () => {
    it("should return all nodes when no nodeId is provided", () => {
      const node1: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      const node2: FleetNode = {
        id: "node-2",
        name: "Atlas-Node-2",
        status: "busy",
        health: { battery: 0.6, cpu: 0.7, memory: 0.5, overall: 0.6 },
        timestamp: Date.now(),
      };

      telemetry.registerNode(node1);
      telemetry.registerNode(node2);

      const allNodes = telemetry.getNodeStatus() as FleetNode[];
      expect(allNodes).toHaveLength(2);
    });

    it("should return specific node when nodeId is provided", () => {
      const node1: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      const node2: FleetNode = {
        id: "node-2",
        name: "Atlas-Node-2",
        status: "busy",
        health: { battery: 0.6, cpu: 0.7, memory: 0.5, overall: 0.6 },
        timestamp: Date.now(),
      };

      telemetry.registerNode(node1);
      telemetry.registerNode(node2);

      const result = telemetry.getNodeStatus("node-2") as FleetNode;
      expect(result.id).toBe("node-2");
      expect(result.status).toBe("busy");
    });

    it("should return undefined for non-existent node", () => {
      const result = telemetry.getNodeStatus("non-existent");
      expect(result).toBeUndefined();
    });
  });

  describe("syncAllNodes", () => {
    it("should return all registered nodes", async () => {
      const node1: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      const node2: FleetNode = {
        id: "node-2",
        name: "Atlas-Node-2",
        status: "online",
        health: { battery: 0.9, cpu: 0.2, memory: 0.3, overall: 0.93 },
        timestamp: Date.now(),
      };

      telemetry.registerNode(node1);
      telemetry.registerNode(node2);

      const eventHandler = jest.fn();
      eventBus.on("fleet:sync", eventHandler);

      const result = await telemetry.syncAllNodes();

      expect(result).toHaveLength(2);
      expect(eventHandler).toHaveBeenCalled();
      expect(telemetry.lastSync).toBeGreaterThan(0);
    });

    it("should emit sync event with node data", async () => {
      const node: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        position: { x: 5, y: 10, z: 0 },
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      telemetry.registerNode(node);

      const eventHandler = jest.fn();
      eventBus.on("fleet:sync", eventHandler);

      await telemetry.syncAllNodes();

      expect(eventHandler).toHaveBeenCalled();
      const event = eventHandler.mock.calls[0][0] as any;
      expect(event.payload.nodes).toHaveLength(1);
      expect(event.payload.timestamp).toBeDefined();
    });
  });

  describe("updateNodeHealth", () => {
    it("should update node health", () => {
      const node: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      telemetry.registerNode(node);
      telemetry.updateNodeHealth("node-1", {
        battery: 0.5,
        cpu: 0.6,
        memory: 0.7,
        overall: 0.5,
      });

      const updatedNode = telemetry.getNodeStatus("node-1") as FleetNode;
      expect(updatedNode.health.overall).toBe(0.5);
      expect(updatedNode.health.battery).toBe(0.5);
    });
  });

  describe("updateNodePosition", () => {
    it("should update node position", () => {
      const node: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        position: { x: 0, y: 0, z: 0 },
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      telemetry.registerNode(node);
      telemetry.updateNodePosition("node-1", { x: 100, y: 200, z: 50 });

      const updatedNode = telemetry.getNodeStatus("node-1") as FleetNode;
      expect(updatedNode.position).toEqual({ x: 100, y: 200, z: 50 });
    });
  });

  describe("getNodeCountByStatus", () => {
    it("should return count of nodes by status", () => {
      telemetry.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      });

      telemetry.registerNode({
        id: "node-2",
        name: "Atlas-Node-2",
        status: "online",
        health: { battery: 0.9, cpu: 0.2, memory: 0.3, overall: 0.93 },
        timestamp: Date.now(),
      });

      telemetry.registerNode({
        id: "node-3",
        name: "Atlas-Node-3",
        status: "offline",
        health: { battery: 0.0, cpu: 0.0, memory: 0.0, overall: 0.0 },
        timestamp: Date.now(),
      });

      const counts = telemetry.getNodeCountByStatus();
      expect(counts.get("online")).toBe(2);
      expect(counts.get("offline")).toBe(1);
    });
  });

  describe("getFleetHealth", () => {
    it("should return average fleet health", () => {
      telemetry.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.8 },
        timestamp: Date.now(),
      });

      telemetry.registerNode({
        id: "node-2",
        name: "Atlas-Node-2",
        status: "online",
        health: { battery: 0.9, cpu: 0.2, memory: 0.3, overall: 0.9 },
        timestamp: Date.now(),
      });

      const health = telemetry.getFleetHealth();
      expect(health).toBeCloseTo(0.85);
    });

    it("should return 0 when no nodes", () => {
      const health = telemetry.getFleetHealth();
      expect(health).toBe(0);
    });
  });

  describe("periodic sync", () => {
    it("should start and stop periodic sync", () => {
      jest.useFakeTimers();

      telemetry.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      });

      const eventHandler = jest.fn();
      eventBus.on("fleet:sync", eventHandler);

      telemetry.startPeriodicSync(100);
      jest.advanceTimersByTime(250);

      expect(eventHandler).toHaveBeenCalled();

      telemetry.stopPeriodicSync();
      jest.advanceTimersByTime(250);

      const callCountAfterStop = eventHandler.mock.calls.length;
      jest.advanceTimersByTime(250);

      expect(eventHandler.mock.calls.length).toBe(callCountAfterStop);

      jest.useRealTimers();
    });
  });
});