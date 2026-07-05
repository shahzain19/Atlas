import { FleetCoordinator, FleetMission, MissionTask } from "../../atlas-fleet/Coordinator/FleetCoordinator";
import { FleetTelemetry, FleetNode } from "../../atlas-fleet/Telemetry/FleetTelemetry";
import { EventBus } from "../../atlas-kernel/Event/EventBus";
import { jest } from "@jest/globals";

describe("FleetCoordinator", () => {
  let coordinator: FleetCoordinator;
  let telemetry: FleetTelemetry;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    telemetry = new FleetTelemetry(eventBus);
    coordinator = new FleetCoordinator(eventBus, telemetry);
  });

  describe("registerNode", () => {
    it("should register a node", () => {
      const node: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      coordinator.registerNode(node);

      expect(coordinator.nodes.get("node-1")).toBeDefined();
    });
  });

  describe("unregisterNode", () => {
    it("should unregister a node", () => {
      const node: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      coordinator.registerNode(node);
      coordinator.unregisterNode("node-1");

      expect(coordinator.nodes.get("node-1")).toBeUndefined();
    });
  });

  describe("createMission", () => {
    it("should create a mission", () => {
      const mission: FleetMission = {
        id: "mission-1",
        name: "Exploration Mission",
        tasks: [
          {
            id: "task-1",
            description: "Explore area",
            status: "pending",
            dependencies: [],
          },
        ],
        assignedNodes: [],
        status: "pending",
        priority: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = coordinator.createMission(mission);

      expect(result.id).toBe("mission-1");
      expect(result.status).toBe("pending");
      expect(coordinator.getMission("mission-1")).toBeDefined();
    });
  });

  describe("coordinateMission", () => {
    it("should coordinate a mission across nodes", () => {
      // Register nodes
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

      coordinator.registerNode(node1);
      coordinator.registerNode(node2);

      const mission: FleetMission = {
        id: "mission-1",
        name: "Multi-node Mission",
        tasks: [
          {
            id: "task-1",
            description: "Task 1",
            status: "pending",
            dependencies: [],
          },
          {
            id: "task-2",
            description: "Task 2",
            status: "pending",
            dependencies: [],
          },
        ],
        assignedNodes: [],
        status: "pending",
        priority: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = coordinator.coordinateMission(mission);

      expect(result.status).toBe("in_progress");
      expect(result.tasks[0].assignedNode).toBeDefined();
      expect(result.tasks[1].assignedNode).toBeDefined();
    });

    it("should emit mission started event", () => {
      const eventHandler = jest.fn();
      eventBus.on("fleet:mission:started", eventHandler);

      const mission: FleetMission = {
        id: "mission-1",
        name: "Test Mission",
        tasks: [],
        assignedNodes: [],
        status: "pending",
        priority: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      coordinator.coordinateMission(mission);

      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe("assignTask", () => {
    it("should assign a task to a node", () => {
      // Register a node
      coordinator.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      });

      const mission: FleetMission = {
        id: "mission-1",
        name: "Test Mission",
        tasks: [
          {
            id: "task-1",
            description: "Test task",
            status: "pending",
            dependencies: [],
          },
        ],
        assignedNodes: [],
        status: "pending",
        priority: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      coordinator.createMission(mission);
      const result = coordinator.assignTask("mission-1", "task-1", "node-1");

      expect(result).toBeDefined();
      expect(result?.tasks[0].assignedNode).toBe("node-1");
      expect(result?.tasks[0].status).toBe("assigned");
    });

    it("should return undefined for non-existent mission", () => {
      const result = coordinator.assignTask("non-existent", "task-1", "node-1");
      expect(result).toBeUndefined();
    });
  });

  describe("handleNodeFailure", () => {
    it("should reassign tasks from failed node", () => {
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

      coordinator.registerNode(node1);
      coordinator.registerNode(node2);

      const mission: FleetMission = {
        id: "mission-1",
        name: "Mission with failing node",
        tasks: [
          {
            id: "task-1",
            description: "Task on node 1",
            assignedNode: "node-1",
            status: "in_progress",
            dependencies: [],
          },
        ],
        assignedNodes: ["node-1"],
        status: "in_progress",
        priority: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      coordinator.createMission(mission);
      coordinator.missions.get(mission.id)!.status = "in_progress";

      const eventHandler = jest.fn();
      eventBus.on("fleet:tasks:reassigned", eventHandler);

      const result = coordinator.handleNodeFailure("node-1");

      expect(result.reassigned).toBe(1);
      expect(eventHandler).toHaveBeenCalled();
    });

    it("should mark tasks as failed if no suitable node exists", () => {
      const node1: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.83 },
        timestamp: Date.now(),
      };

      coordinator.registerNode(node1);

      const mission: FleetMission = {
        id: "mission-1",
        name: "Mission with failing node",
        tasks: [
          {
            id: "task-1",
            description: "Task on node 1",
            assignedNode: "node-1",
            status: "in_progress",
            dependencies: [],
          },
        ],
        assignedNodes: ["node-1"],
        status: "in_progress",
        priority: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      coordinator.createMission(mission);
      coordinator.missions.get(mission.id)!.status = "in_progress";

      // No other nodes to reassign to
      const result = coordinator.handleNodeFailure("node-1");

      expect(result.reassigned).toBe(0);
      expect(result.failed).toBe(1);
    });
  });

  describe("consensus", () => {
    it("should reach consensus among healthy nodes", async () => {
      const node1: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.8 },
        timestamp: Date.now(),
      };

      const node2: FleetNode = {
        id: "node-2",
        name: "Atlas-Node-2",
        status: "online",
        health: { battery: 0.9, cpu: 0.2, memory: 0.3, overall: 0.9 },
        timestamp: Date.now(),
      };

      coordinator.registerNode(node1);
      coordinator.registerNode(node2);

      const result = await coordinator.consensus("Deploy to new area");

      expect(result.agreed).toBe(true);
      expect(result.votes.size).toBe(2);
    });

    it("should fail consensus when too few nodes agree", async () => {
      const node1: FleetNode = {
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.1, cpu: 0.3, memory: 0.4, overall: 0.1 },
        timestamp: Date.now(),
      };

      coordinator.registerNode(node1);

      const result = await coordinator.consensus("Deploy to new area");

      // Node with low health will vote false
      expect(result.agreed).toBe(false);
    });

    it("should emit consensus result event", async () => {
      const eventHandler = jest.fn();
      eventBus.on("fleet:consensus:result", eventHandler);

      coordinator.registerNode({
        id: "node-1",
        name: "Atlas-Node-1",
        status: "online",
        health: { battery: 0.8, cpu: 0.3, memory: 0.4, overall: 0.8 },
        timestamp: Date.now(),
      });

      await coordinator.consensus("Test proposal");

      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe("sendMessage", () => {
    it("should send a message and return formatted message", () => {
      const message = coordinator.sendMessage({
        sender: "coordinator",
        recipient: "node-1",
        type: "COMMAND",
        payload: { command: "start" },
      });

      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeDefined();
      expect(message.sender).toBe("coordinator");
      expect(message.recipient).toBe("node-1");
    });

    it("should emit message sent event", () => {
      const eventHandler = jest.fn();
      eventBus.on("fleet:message:sent", eventHandler);

      coordinator.sendMessage({
        sender: "coordinator",
        recipient: "all",
        type: "BROADCAST",
        payload: { message: "Hello fleet" },
      });

      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe("getAllMissions", () => {
    it("should return all missions", () => {
      coordinator.createMission({
        id: "mission-1",
        name: "Mission 1",
        tasks: [],
        assignedNodes: [],
        status: "pending",
        priority: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      coordinator.createMission({
        id: "mission-2",
        name: "Mission 2",
        tasks: [],
        assignedNodes: [],
        status: "pending",
        priority: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const missions = coordinator.getAllMissions();
      expect(missions).toHaveLength(2);
    });
  });

  describe("updateMissionStatus", () => {
    it("should update mission status", () => {
      coordinator.createMission({
        id: "mission-1",
        name: "Mission 1",
        tasks: [],
        assignedNodes: [],
        status: "pending",
        priority: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      coordinator.updateMissionStatus("mission-1", "completed");

      const mission = coordinator.getMission("mission-1");
      expect(mission?.status).toBe("completed");
    });
  });
});