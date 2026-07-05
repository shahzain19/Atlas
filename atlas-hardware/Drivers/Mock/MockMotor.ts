import { Actuator, CapabilityType } from "../../../atlas-kernel/Hardware/Hardware";

export class MockMotor implements Actuator {
  type = CapabilityType.MOTION;
  name = "MockMotor";
  specs = { maxRPM: 5000, torque: "2.5Nm" };

  async execute(command: string, params: Record<string, any>): Promise<void> {
    console.log(`[MockMotor] Executing command: ${command} with params:`, params);
    // Simulate hardware latency
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`[MockMotor] Command ${command} completed.`);
  }
}
