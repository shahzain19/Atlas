import { Swarm, SwarmSignal, SwarmBehavior, SwarmBehaviorPattern } from "../../atlas-fleet/Swarm/Swarm";
import { FleetTelemetry, FleetNode } from "../../atlas-fleet/Telemetry/FleetTelemetry";
import { AgentRegistry } from "../../atlas-agents/AgentRegistry/AgentRegistry";
import { EventBus } from "../../atlas-kernel/Event/EventBus";
import { jest } from "@jest/globals";

describe("Swarm", () => {
  let swarm: Swarm;
  let telemetry: FleetTelemetry;
  let agentRegistry: AgentRegistry;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    telemetry = new FleetTelemetry(eventBus);
    agentRegistry = new AgentRegistry();
    swarm = new Swarm(agentRegistry, telemetry, eventBus);
  });

  describe("broadcastSignal", () => {
    it("should broadcast a signal", () => {
      const signal = swarm.broadcastSignal({
        type: "INFO",
        sourceNode: "node-1",
        targetNodes: ["node-2", "node-3"],
        payload: { message: "Hello" },
      });

      expect(signal.id).toBeDefined();
      expect(signal.timestamp).toBeDefined();
      expect(signal.type).toBe("INFO");
      expect(signal.sourceNode).toBe("node-1");
      expect(signal.targetNodes).toEqual(["node-2", "node-3"]);
    });

    it("should add signal to signals array", () => {
      swarm.broadcastSignal({
        type: "ALERT",
        sourceNode: "node-1",
        targetNodes: ["node-2"],
        payload: { alert: "Danger" },
      });

      const signals = swarm.getSignals();
      expect(signals).toHaveLength(1);
      expect(signals[0].type).toBe("ALERT");
    });

    it("should emit broadcast event", () => {
      const eventHandler = jest.fn();
      eventBus.on("swarm:signal:broadcast", eventHandler);

      swarm.broadcastSignal({
        type: "INFO",
        sourceNode: "node-1",
        targetNodes: ["node-2"],
        payload: {},
      });

      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe("receiveSignal", () => {
    it("should receive and process a signal", () => {
      const signal: SwarmSignal = {
        id: "signal-1",
        type: "REQUEST",
        sourceNode: "node-1",
        targetNodes: ["node-2"],
        payload: { request: "status" },
        timestamp: Date.now(),
      };

      const result = swarm.receiveSignal(signal);

      expect(result.timestamp).toBeDefined();
      expect(swarm.getSignals()).toHaveLength(1);
    });

    it("should emit signal received event", () => {
      const eventHandler = jest.fn();
      eventBus.on("swarm:signal:received", eventHandler);

      const signal: SwarmSignal = {
        id: "signal-1",
        type: "ALERT",
        sourceNode: "node-1",
        targetNodes: ["node-2"],
        payload: { alert: "Critical" },
        timestamp: Date.now(),
      };

      swarm.receiveSignal(signal);

      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe("formConsensus", () => {
    it("should form consensus among nodes", async () => {
      // Register nodes
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

      const result = await swarm.formConsensus("Move to new position");

      expect(result.success).toBe(true);
      expect(result.totalNodes).toBe(2);
      expect(result.agreeingNodes).toBe(2);
    });

    it("should form consensus with specific node list", async () => {
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

      const result = await swarm.formConsensus("Test proposal", ["node-1"]);

      expect(result.totalNodes).toBe(1);
      expect(result.agreeingNodes).toBe(1);
    });

    it("should fail consensus when health is low", async () => {
      telemetry.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.1, cpu: 0.3, memory: 0.4, overall: 0.1 },
        timestamp: Date.now(),
      });

      const result = await swarm.formConsensus("Deploy to area");

      // Node with low health votes false
      expect(result.success).toBe(false);
      expect(result.consensus).toBe(0);
    });

    it("should emit consensus event", async () => {
      const eventHandler = jest.fn();
      eventBus.on("swarm:consensus", eventHandler);

      telemetry.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.8 },
        timestamp: Date.now(),
      });

      await swarm.formConsensus("Test proposal");

      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe("executeSwarmBehavior", () => {
    it("should execute a swarm behavior pattern", () => {
      telemetry.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      });

      const behavior = swarm.executeSwarmBehavior(SwarmBehaviorPattern.FORMATION, {
        formationType: "V",
        spacing: 2.0,
      });

      expect(behavior.pattern).toBe(SwarmBehaviorPattern.FORMATION);
      expect(behavior.active).toBe(true);
      expect(behavior.parameters).toEqual({ formationType: "V", spacing: 2.0 });
    });

    it("should broadcast sync signal when executing behavior", () => {
      const broadcastHandler = jest.fn();
      eventBus.on("swarm:signal:broadcast", broadcastHandler);

      telemetry.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.8 },
        timestamp: Date.now(),
      });

      swarm.executeSwarmBehavior(SwarmBehaviorPattern.SEARCH, { area: "sector-1" });

      expect(broadcastHandler).toHaveBeenCalled();
    });

    it("should emit behavior started event", () => {
      const eventHandler = jest.fn();
      eventBus.on("swarm:behavior:started", eventHandler);

      telemetry.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.8 },
        timestamp: Date.now(),
      });

      swarm.executeSwarmBehavior(SwarmBehaviorPattern.EXPLORE, {});

      expect(eventHandler).toHaveBeenCalled();
    });

    it("should track active behaviors", () => {
      telemetry.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.8 },
        timestamp: Date.now(),
      });

      swarm.executeSwarmBehavior(SwarmBehaviorPattern.FOLLOW, { target: "node-1" });
      swarm.executeSwarmBehavior(SwarmBehaviorPattern.GATHER, { point: { x: 0, y: 0 } });

      const activeBehaviors = swarm.getActiveBehaviors();
      expect(activeBehaviors).toHaveLength(2);
    });
  });

  describe("stopSwarmBehavior", () => {
    it("should stop an active behavior", () => {
      telemetry.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.8 },
        timestamp: Date.now(),
      });

      swarm.executeSwarmBehavior(SwarmBehaviorPattern.FORMATION, {});
      swarm.stopSwarmBehavior(SwarmBehaviorPattern.FORMATION);

      const activeBehaviors = swarm.getActiveBehaviors();
      expect(activeBehaviors).toHaveLength(0);
    });

    it("should emit behavior stopped event", () => {
      const eventHandler = jest.fn();
      eventBus.on("swarm:behavior:stopped", eventHandler);

      telemetry.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.8 },
        timestamp: Date.now(),
      });

      swarm.executeSwarmBehavior(SwarmBehaviorPattern.SEARCH, {});
      swarm.stopSwarmBehavior(SwarmBehaviorPattern.SEARCH);

      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe("registerAgent", () => {
    it("should register an agent", () => {
      const mockAgent = { name: "TestAgent", process: jest.fn() };

      swarm.registerAgent("agent-1", mockAgent);

      expect(swarm.agents.has("agent-1")).toBe(true);
      expect(swarm.getAgentIds()).toContain("agent-1");
    });
  });

  describe("unregisterAgent", () => {
    it("should unregister an agent", () => {
      const mockAgent = { name: "TestAgent" };

      swarm.registerAgent("agent-1", mockAgent);
      swarm.unregisterAgent("agent-1");

      expect(swarm.agents.has("agent-1")).toBe(false);
    });
  });

  describe("getSignals", () => {
    it("should return all received signals", () => {
      swarm.broadcastSignal({
        type: "INFO",
        sourceNode: "node-1",
        targetNodes: ["node-2"],
        payload: {},
      });

      swarm.broadcastSignal({
        type: "ALERT",
        sourceNode: "node-2",
        targetNodes: ["node-1"],
        payload: {},
      });

      const signals = swarm.getSignals();
      expect(signals).toHaveLength(2);
    });
  });

  describe("getActiveBehaviors", () => {
    it("should return only active behaviors", () => {
      telemetry.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.8 },
        timestamp: Date.now(),
      });

      swarm.executeSwarmBehavior(SwarmBehaviorPattern.FORMATION, {});
      swarm.executeSwarmBehavior(SwarmBehaviorPattern.SEARCH, {});

      swarm.stopSwarmBehavior(SwarmBehaviorPattern.SEARCH);

      const activeBehaviors = swarm.getActiveBehaviors();
      expect(activeBehaviors).toHaveLength(1);
      expect(activeBehaviors[0].pattern).toBe(SwarmBehaviorPattern.FORMATION);
    });
  });

  describe("getStats", () => {
    it("should return swarm statistics", () => {
      telemetry.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.8 },
        timestamp: Date.now(),
      });

      const mockAgent = { name: "TestAgent" };
      swarm.registerAgent("agent-1", mockAgent);

      swarm.broadcastSignal({
        type: "INFO",
        sourceNode: "node-1",
        targetNodes: [],
        payload: {},
      });

      const stats = swarm.getStats();
      expect(stats.agentCount).toBe(1);
      expect(stats.signalCount).toBe(1);
      expect(stats.nodeCount).toBe(1);
    });
  });
});