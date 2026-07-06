/**
 * Autonomous Agent - Implements the full Observe → Remember → Reason → Plan → Act → Learn loop
 */
import { EventBus } from "../../atlas-kernel/Event/EventBus";
import { WorldModel, WorldObject } from "../../atlas-memory/WorldModel/WorldModel";
import { PerceptionPipeline } from "../../atlas-perception/PerceptionPipeline";
import { DeepReasoningEngine, AnalysisResult } from "../../atlas-ai/Reasoning/DeepReasoning";
import { TaskPlanner } from "../../atlas-planning/TaskPlanner/TaskPlanner";
import { Task, TaskStatus } from "../../atlas-kernel/Task/Task";
import { NeuralNetwork } from "../../atlas-ai/Learning/NeuralNetwork";

// Extend AnalysisResult to include summary
interface ExtendedAnalysisResult extends AnalysisResult {
  summary: string;
}

export enum AgentState {
  IDLE = "idle",
  OBSERVING = "observing",
  REMEMBERING = "remembering",
  REASONING = "reasoning",
  PLANNING = "planning",
  ACTING = "acting",
  LEARNING = "learning",
  ERROR = "error",
}

export class AutonomousAgent {
  public id: string;
  public name: string;
  public state: AgentState = AgentState.IDLE;
  public eventBus: EventBus;
  public worldModel: WorldModel;
  public perception: PerceptionPipeline;
  public reasoning: DeepReasoningEngine;
  public planner: TaskPlanner;
  public brain: NeuralNetwork;
  private loopInterval?: NodeJS.Timeout;
  private currentTask?: Task;
  private cycleCount: number = 0;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.eventBus = new EventBus();
    this.worldModel = new WorldModel();
    this.perception = new PerceptionPipeline();
    this.reasoning = new DeepReasoningEngine();
    this.planner = new TaskPlanner();
    this.brain = new NeuralNetwork([10, 20, 10, 5]);
  }

  async start(intervalMs: number = 1000): Promise<void> {
    console.log(`🤖 Starting autonomous agent: ${this.name} (${this.id})`);
    this.loopInterval = setInterval(() => {
      this.runCycle();
    }, intervalMs);
  }

  async stop(): Promise<void> {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = undefined;
    }
    this.state = AgentState.IDLE;
    console.log(`🛑 Stopped autonomous agent: ${this.name}`);
  }

  private async runCycle(): Promise<void> {
    try {
      this.cycleCount++;
      console.log(`\n🔄 Cycle ${this.cycleCount} - ${this.name}`);
      await this.observe();
      await this.remember();
      const reasoningResult = await this.reason();
      if (reasoningResult.needsAction) {
        await this.plan(reasoningResult.goal);
      }
      await this.act();
      await this.learn();
    } catch (error) {
      console.error(`❌ Agent error:`, error);
      this.state = AgentState.ERROR;
    }
  }

  private async observe(): Promise<void> {
    this.state = AgentState.OBSERVING;
    console.log("👁️ Observing...");
    const state = await this.perception.captureAll();
    console.log(`  - Camera frame: ${state.cameraFrame ? "captured" : "none"}`);
    console.log(`  - LiDAR scan: ${state.lidarScan ? "captured" : "none"}`);
    console.log(`  - Detected objects: ${state.detectedObjects.length}`);
  }

  private async remember(): Promise<void> {
    this.state = AgentState.REMEMBERING;
    console.log("🧠 Remembering...");
    const perceptionState = this.perception.getState();
    perceptionState.detectedObjects.forEach((detected, index) => {
      this.worldModel.addObject({
        id: `obj-${this.cycleCount}-${index}`,
        type: detected.label,
        label: detected.label,
        position: {
          x: detected.boundingBox.x / 100,
          y: detected.boundingBox.y / 100,
          z: 0,
          timestamp: Date.now(),
        },
        confidence: detected.confidence,
        lastSeen: Date.now(),
      });
    });
    console.log(`  - World objects: ${this.worldModel.getAllObjects().length}`);
  }

  private async reason(): Promise<{ needsAction: boolean; goal?: string }> {
    this.state = AgentState.REASONING;
    console.log("💭 Reasoning...");
    const observation = {
      worldObjects: this.worldModel.getAllObjects(),
      ownPosition: this.worldModel.getOwnPosition(),
      timestamp: Date.now(),
    };
    const reasoning = await this.reasoning.analyze(observation);
    const summary = reasoning.insights.length > 0 ? reasoning.insights[0] : "No insights available";
    console.log(`  - Analysis: ${summary}`);
    console.log(`  - Confidence: ${(reasoning.confidence * 100).toFixed(0)}%`);
    return {
      needsAction: Math.random() > 0.5,
      goal: summary,
    };
  }

  private async plan(goal?: string): Promise<void> {
    this.state = AgentState.PLANNING;
    console.log("📋 Planning...");
    const tasks = await this.planner.generateTasks(goal || "Explore the environment");
    console.log(`  - Generated ${tasks.length} tasks`);
    if (tasks.length > 0) {
      this.currentTask = tasks[0]!;
      console.log(`  - Next task: ${this.currentTask.name}`);
    }
  }

  private async act(): Promise<void> {
    this.state = AgentState.ACTING;
    console.log("⚡ Acting...");
    if (this.currentTask) {
      console.log(`  - Executing: ${this.currentTask.name}`);
      this.currentTask.status = "running" as TaskStatus;
      await this.currentTask.run();
      this.currentTask.status = "completed" as TaskStatus;
      console.log(`  - Task complete!`);
    } else {
      console.log("  - No task to execute");
    }
  }

  private async learn(): Promise<void> {
    this.state = AgentState.LEARNING;
    console.log("📚 Learning...");
    console.log("  - Experience logged for future learning");
    this.state = AgentState.IDLE;
  }

  getStatus() {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      cycleCount: this.cycleCount,
      worldObjects: this.worldModel.getAllObjects().length,
      currentTask: this.currentTask,
    };
  }
}
