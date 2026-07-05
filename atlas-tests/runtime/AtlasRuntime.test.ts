import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";
import { Mission } from "../../atlas-kernel/Mission/Mission";
import { Event } from "../../atlas-kernel/Event/Event";
import { Task } from "../../atlas-kernel/Task/Task";
import { BaseAgent } from "../../atlas-agents/BaseAgent/BaseAgent";
import { RecoverySystem } from "../../atlas-runtime/Recovery/RecoverySystem";

class NoopAgent extends BaseAgent {
  readonly name = "NoopAgent";
  handle(_event: Event) {
    return [];
  }
}

describe("AtlasRuntime", () => {
  let runtime: AtlasRuntime;

  beforeEach(() => {
    runtime = new AtlasRuntime();
  });

  describe("initialization", () => {
    it("should initialize with all subsystems", () => {
      expect(runtime.bus).toBeDefined();
      expect(runtime.tasks).toBeDefined();
      expect(runtime.agents).toBeDefined();
      expect(runtime.memory).toBeDefined();
      expect(runtime.history).toBeDefined();
      expect(runtime.context).toBeDefined();
      expect(runtime.missions).toBeDefined();
      expect(runtime.hardware).toBeDefined();
      expect(runtime.perception).toBeDefined();
      expect(runtime.slam).toBeDefined();
      expect(runtime.ros).toBeDefined();
      expect(runtime.reasoning).toBeDefined();
      expect(runtime.capabilities).toBeDefined();
      expect(runtime.configuration).toBeDefined();
      expect(runtime.log).toBeDefined();
      expect(runtime.plugins).toBeDefined();
    });
  });

  describe("lifecycle", () => {
    it("should start and stop", () => {
      expect(runtime.isActive()).toBe(false);
      runtime.start();
      expect(runtime.isActive()).toBe(true);
      runtime.stop();
      expect(runtime.isActive()).toBe(false);
    });

    it("should not start twice", () => {
      runtime.start();
      runtime.start();
      expect(runtime.isActive()).toBe(true);
    });

    it("should not stop twice", () => {
      runtime.start();
      runtime.stop();
      runtime.stop();
      expect(runtime.isActive()).toBe(false);
    });
  });

  describe("event pipeline", () => {
    it("should emit events through the pipeline", async () => {
      const busSpy = jest.spyOn(runtime.bus, "emit");

      const event: Event = {
        type: "TEST_EVENT",
        timestamp: Date.now(),
        payload: { value: 42 },
      };

      await runtime.emit(event);

      expect(busSpy).toHaveBeenCalled();
      const recent = runtime.memory.getRecent(1);
      expect(recent).toHaveLength(1);
      expect(recent[0].type).toBe("TEST_EVENT");
    });

    it("should store important events in long-term memory", async () => {
      const ltmSpy = jest.spyOn(runtime.history, "logEvent");

      const event: Event = {
        type: "IMPORTANT_EVENT",
        timestamp: Date.now(),
        payload: { data: "critical" },
        metadata: { importance: 0.8 },
      };

      await runtime.emit(event);
      expect(ltmSpy).toHaveBeenCalled();
    });

    it("should skip long-term storage for low importance events", async () => {
      const ltmSpy = jest.spyOn(runtime.history, "logEvent");

      const event: Event = {
        type: "TRIVIAL_EVENT",
        timestamp: Date.now(),
        payload: {},
        metadata: { importance: 0.1 },
      };

      await runtime.emit(event);
      expect(ltmSpy).not.toHaveBeenCalled();
    });

    it("should update sensor fusion on perception events", async () => {
      const fusionSpy = jest.spyOn(runtime.perception, "update");

      const event: Event = {
        type: "GPS_UPDATE",
        timestamp: Date.now(),
        payload: { latitude: 37.77, longitude: -122.41 },
        source: "test",
        metadata: { category: "perception" },
      };

      await runtime.emit(event);
      expect(fusionSpy).toHaveBeenCalled();
    });
  });

  describe("task management", () => {
    it("should register and run a task", async () => {
      const runSpy = jest.spyOn(runtime.tasks, "run").mockResolvedValue(undefined);

      const task: Task = {
        id: "task-1",
        name: "Test Task",
        status: "pending",
        run: jest.fn().mockResolvedValue(undefined),
      };

      runtime.registerTask(task);
      await runtime.runTask("task-1");

      expect(runtime.tasks.getTask("task-1")).toBe(task);
      expect(runSpy).toHaveBeenCalledWith("task-1");
    });

    it("should rethrow after recovery failure", async () => {
      jest.spyOn(RecoverySystem.prototype, "recover").mockResolvedValue(false);

      const task: Task = {
        id: "task-fail",
        name: "Failing Task",
        status: "pending",
        run: jest.fn().mockRejectedValue(new Error("task error")),
      };

      runtime.registerTask(task);
      await expect(runtime.runTask("task-fail")).rejects.toThrow("task error");
    });
  });

  describe("missions", () => {
    it("should submit and complete a mission with no goals", async () => {
      const mission: Mission = {
        id: "mission-1",
        name: "Test Mission",
        status: "pending",
        goals: [],
      };

      await runtime.submitMission(mission);
      expect(mission.status).toBe("completed");
    });
  });

  describe("agent communication", () => {
    it("should send messages between agents", () => {
      const agent = new NoopAgent();
      const routeSpy = jest.spyOn(runtime.agents, "route");

      runtime.agents.register(agent);

      runtime.sendMessage({
        id: "msg-1",
        sender: "test",
        recipient: "all",
        type: "TEST",
        payload: {},
        timestamp: Date.now(),
      });

      expect(routeSpy).toHaveBeenCalled();
    });
  });
});
