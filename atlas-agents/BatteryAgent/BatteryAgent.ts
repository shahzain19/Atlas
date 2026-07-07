import { BaseAgent } from "../BaseAgent/BaseAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai_deprecated/Decision/types";
import { AgentMessage } from "../../atlas-kernel/Communication/AgentMessage";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";

export class BatteryAgent extends BaseAgent {
  readonly name = "BatteryAgent";
  private runtime: AtlasRuntime;
  private batteryLevel: number = 100;

  constructor(runtime: AtlasRuntime) {
    super();
    this.runtime = runtime;
  }

  getBatteryLevel(): number {
    return this.batteryLevel;
  }

  handle(event: Event): Decision[] {
    if (event.type === "BATTERY_UPDATE") {
      const level = event.payload?.level;
      if (typeof level === "number" && level >= 0 && level <= 100) {
        this.batteryLevel = level;
      }
      return [];
    }

    if (event.type === "TICK") {
      this.batteryLevel = Math.max(0, this.batteryLevel - 0.05);

      this.runtime.emit({
        type: "BATTERY_UPDATE",
        source: this.name,
        timestamp: Date.now(),
        payload: { level: this.batteryLevel },
      });

      if (this.batteryLevel < 20) {
        const level = this.batteryLevel;
        return [
          {
            name: "EmergencyCharge",
            confidence: 1.0,
            execute: () => {
              this.runtime.emit({
                type: "BATTERY_CRITICAL",
                source: this.name,
                timestamp: Date.now(),
                payload: { level },
              });

              this.runtime.sendMessage({
                id: `msg-${Date.now()}`,
                sender: this.name,
                recipient: "all",
                type: "BATTERY_CRITICAL",
                payload: { level },
                timestamp: Date.now(),
              });
            },
          },
        ];
      }

      if (this.batteryLevel < 50) {
        const level = this.batteryLevel;
        return [
          {
            name: "RequestCharge",
            confidence: 0.8,
            execute: () => {
              this.runtime.emit({
                type: "BATTERY_LOW",
                source: this.name,
                timestamp: Date.now(),
                payload: { level },
              });
            },
          },
        ];
      }

      return [];
    }

    return [];
  }

  receive(message: AgentMessage): void {
    if (message.type === "BATTERY_CRITICAL") {
      console.warn(`[BatteryAgent] Received BATTERY_CRITICAL from ${message.sender}`);
    }
  }
}
