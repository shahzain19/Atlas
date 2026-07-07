import { BaseAgent } from "../BaseAgent/BaseAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai_deprecated/Decision/types";
import { AgentMessage } from "../../atlas-kernel/Communication/AgentMessage";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";
import { Waypoint, WaypointEntry } from "../../atlas-navigation_deprecated/Waypoint/Waypoint";
import { ObstacleAvoidance, Obstacle } from "../../atlas-navigation_deprecated/Avoidance/ObstacleAvoidance";
import { Vector3 } from "../../atlas-kernel/Perception/StateEstimate";

// ---------------------------------------------------------------------------
// Navigation state machine
// ---------------------------------------------------------------------------
type NavState = "IDLE" | "NAVIGATING" | "AVOIDING" | "ARRIVED";

export class NavigationAgent extends BaseAgent {
  readonly name = "NavigationAgent";

  private runtime: AtlasRuntime;
  private avoidance: ObstacleAvoidance;

  private queue: WaypointEntry[] = [];
  private currentWaypointIndex = 0;
  private navState: NavState = "IDLE";

  /** Metres/tick pseudo-speed (used for simulation progress). */
  private readonly speed = 0.5;

  /** Default arrival tolerance in metres. */
  private readonly defaultTolerance = 2.0;

  /** Current position estimate (updated from SensorFusion on every TICK). */
  private currentPos: Vector3 = { x: 0, y: 0, z: 0 };

  /** Ticks spent in AVOIDING state before forcing a resume. */
  private avoidanceTicks = 0;
  private readonly maxAvoidanceTicks = 10;

  constructor(runtime: AtlasRuntime) {
    super();
    this.runtime = runtime;
    this.avoidance = new ObstacleAvoidance(5000);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Enqueue a list of waypoints.  Starts navigation immediately if IDLE. */
  loadWaypoints(waypoints: Waypoint[]): void {
    this.queue = waypoints.map((wp) => ({ waypoint: wp, status: "pending" as const }));
    this.currentWaypointIndex = 0;
    if (waypoints.length > 0) {
      this.navState = "NAVIGATING";
      console.log(
        `[NavigationAgent] Mission loaded — ${waypoints.length} waypoint(s).`
      );
    }
  }

  getState(): NavState {
    return this.navState;
  }

  getQueue(): WaypointEntry[] {
    return [...this.queue];
  }

  getCurrentPosition(): Vector3 {
    return { ...this.currentPos };
  }

  // ---------------------------------------------------------------------------
  // BaseAgent interface
  // ---------------------------------------------------------------------------

  handle(event: Event): Decision[] {
    switch (event.type) {
      case "TICK":
        return this.onTick();

      case "OBSTACLE_DETECTED":
        return this.onObstacleDetected(event);

      case "GPS_UPDATE":
        // Keep our position estimate in sync with the sensor fusion output
        this.syncPositionFromRuntime();
        return [];

      case "NAV_LOAD_WAYPOINTS":
        if (Array.isArray(event.payload?.waypoints)) {
          this.loadWaypoints(event.payload.waypoints as Waypoint[]);
        }
        return [];

      case "NAV_ABORT":
        this.abort();
        return [];

      default:
        return [];
    }
  }

  receive(message: AgentMessage): void {
    if (message.type === "OBJECT_DETECTED") {
      // Treat any detected object as a potential obstacle
      const obs: Obstacle = {
        id: `obs-${message.payload.object}-${Date.now()}`,
        position: message.payload.position ?? { x: 0, y: 0, z: 0 },
        radius: 1.5,
        confidence: message.payload.confidence ?? 0.5,
        timestamp: Date.now(),
      };
      this.avoidance.addOrUpdate(obs);
      console.log(
        `[NavigationAgent] Obstacle registered from VisionAgent: ${message.payload.object}`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Tick logic — the main navigation loop
  // ---------------------------------------------------------------------------

  private onTick(): Decision[] {
    if (this.navState === "IDLE" || this.navState === "ARRIVED") {
      return [];
    }

    const entry = this.activeEntry();
    if (!entry) {
      this.navState = "ARRIVED";
      return [];
    }

    const target = entry.waypoint.position;
    const tolerance = entry.waypoint.tolerance ?? this.defaultTolerance;

    // 1. Check arrival
    if (this.distance(this.currentPos, target) <= tolerance) {
      return this.reachWaypoint(entry);
    }

    // 2. Handle avoidance state
    if (this.navState === "AVOIDING") {
      this.avoidanceTicks++;
      if (this.avoidanceTicks >= this.maxAvoidanceTicks) {
        // Force resume — we've waited long enough
        console.log(`[NavigationAgent] Avoidance timeout — resuming towards waypoint.`);
        this.navState = "NAVIGATING";
        this.avoidanceTicks = 0;
      } else {
        return this.executeAvoidance(target);
      }
    }

    // 3. Normal navigation — check if path is blocked
    if (this.avoidance.pathBlocked(this.currentPos, target)) {
      return [this.buildDecision("EnterAvoidance", 1.0, () => {
        this.navState = "AVOIDING";
        this.avoidanceTicks = 0;
        console.log(`[NavigationAgent] Path blocked — entering avoidance mode.`);
        this.runtime.emit({
          type: "NAV_AVOIDING",
          source: this.name,
          timestamp: Date.now(),
          payload: { waypoint: entry.waypoint, position: this.currentPos },
        });
      })];
    }

    // 4. Move towards target (simulation step)
    this.stepTowards(target);
    return [];
  }

  // ---------------------------------------------------------------------------
  // Obstacle event
  // ---------------------------------------------------------------------------

  private onObstacleDetected(event: Event): Decision[] {
    const obs: Obstacle = {
      id: `obs-${Date.now()}`,
      position: event.payload?.position ?? { x: 0, y: 0, z: 0 },
      radius: event.payload?.radius ?? 2.0,
      confidence: event.payload?.confidence ?? 0.8,
      timestamp: Date.now(),
    };
    this.avoidance.addOrUpdate(obs);

    if (this.navState === "NAVIGATING") {
      return [this.buildDecision("TriggerAvoidance", 1.0, () => {
        this.navState = "AVOIDING";
        this.avoidanceTicks = 0;
        console.log(`[NavigationAgent] OBSTACLE_DETECTED — entering avoidance.`);
        this.runtime.emit({
          type: "NAV_AVOIDING",
          source: this.name,
          timestamp: Date.now(),
          payload: obs,
        });
      })];
    }

    return [];
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private executeAvoidance(target: Vector3): Decision[] {
    const repulsion = this.avoidance.computeAvoidanceVector(this.currentPos);
    const toDest = this.normalise(this.subtract(target, this.currentPos));

    // Blend repulsion into heading
    const blended: Vector3 = {
      x: toDest.x + repulsion.x * 0.6,
      y: toDest.y + repulsion.y * 0.6,
      z: toDest.z + repulsion.z * 0.6,
    };
    const heading = this.normalise(blended);

    this.currentPos.x += heading.x * this.speed;
    this.currentPos.y += heading.y * this.speed;
    this.currentPos.z += heading.z * this.speed;

    return [];
  }

  private reachWaypoint(entry: WaypointEntry): Decision[] {
    entry.status = "reached";
    const wp = entry.waypoint;
    console.log(`[NavigationAgent] ✅ Waypoint reached: ${wp.label ?? wp.id}`);

    this.runtime.emit({
      type: "WAYPOINT_REACHED",
      source: this.name,
      timestamp: Date.now(),
      payload: { waypointId: wp.id, label: wp.label, position: wp.position },
    });

    this.currentWaypointIndex++;
    const next = this.activeEntry();

    if (!next) {
      this.navState = "ARRIVED";
      console.log(`[NavigationAgent] 🏁 All waypoints complete.`);
      this.runtime.emit({
        type: "NAVIGATION_COMPLETE",
        source: this.name,
        timestamp: Date.now(),
        payload: { totalWaypoints: this.queue.length },
      });
      return [];
    }

    console.log(
      `[NavigationAgent] → Next waypoint: ${next.waypoint.label ?? next.waypoint.id}`
    );
    next.status = "active";
    return [];
  }

  private stepTowards(target: Vector3): void {
    const dir = this.normalise(this.subtract(target, this.currentPos));
    this.currentPos.x += dir.x * this.speed;
    this.currentPos.y += dir.y * this.speed;
    this.currentPos.z += dir.z * this.speed;
  }

  private syncPositionFromRuntime(): void {
    const state = this.runtime.perception.getState();
    this.currentPos = { ...state.position };
  }

  private activeEntry(): WaypointEntry | null {
    if (this.currentWaypointIndex >= this.queue.length) return null;
    const entry = this.queue[this.currentWaypointIndex];
    if (entry.status === "pending") entry.status = "active";
    return entry;
  }

  private abort(): void {
    this.navState = "IDLE";
    this.queue = [];
    this.currentWaypointIndex = 0;
    this.avoidance.clear();
    console.log(`[NavigationAgent] Navigation aborted.`);
    this.runtime.emit({
      type: "NAV_ABORTED",
      source: this.name,
      timestamp: Date.now(),
      payload: {},
    });
  }

  private buildDecision(name: string, confidence: number, fn: () => void): Decision {
    return { name, confidence, execute: fn };
  }

  private distance(a: Vector3, b: Vector3): number {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private subtract(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  private normalise(v: Vector3): Vector3 {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (len < 0.0001) return { x: 0, y: 0, z: 0 };
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }
}
