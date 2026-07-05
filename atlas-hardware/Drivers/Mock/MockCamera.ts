import { Actuator, CapabilityType } from "../../../atlas-kernel/Hardware/Hardware";

export class MockCamera implements Actuator {
  type = CapabilityType.IMAGING;
  name = "MockCamera";
  specs = { resolution: "4K", sensor: "CMOS" };

  async execute(command: string, params: Record<string, any>): Promise<void> {
    console.log(`[MockCamera] Executing command: ${command} with params:`, params);
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`[MockCamera] Image captured at ${params.resolution || "default"} resolution.`);
  }
}
