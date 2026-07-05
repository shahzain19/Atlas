import { StateEstimate, Observation, Vector3 } from "../../atlas-kernel/Perception/StateEstimate";

export class SensorFusion {
  private currentState: StateEstimate;

  constructor() {
    this.currentState = {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      confidence: 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Updates the current state estimate using a new observation.
   * Implements a simple weighted average (linear fusion).
   */
  update(observation: Observation): StateEstimate {
    if (observation.type === "position") {
      const pos = observation.data as Vector3;
      
      // Weight is inversely proportional to uncertainty (simulated Kalman Gain)
      const k = 1.0 / (1.0 + observation.uncertainty);
      
      this.currentState.position.x = this.currentState.position.x * (1 - k) + pos.x * k;
      this.currentState.position.y = this.currentState.position.y * (1 - k) + pos.y * k;
      this.currentState.position.z = this.currentState.position.z * (1 - k) + pos.z * k;
      
      // Update confidence
      this.currentState.confidence = Math.min(1.0, this.currentState.confidence + (k * 0.1));
    }

    this.currentState.timestamp = Date.now();
    return { ...this.currentState };
  }

  getState(): StateEstimate {
    return { ...this.currentState };
  }
}
