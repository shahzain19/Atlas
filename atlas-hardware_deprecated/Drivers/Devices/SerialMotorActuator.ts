import { Actuator, CapabilityType } from "../../../atlas-kernel/Hardware/Hardware";
import { HardwareStatus } from "../../HAL/HardwareAbstractionLayer";
import { SerialPortDriver } from "../Real/SerialPortDriver";
import { MemorySerialTransport, SerialTransport } from "../../Transport/SerialTransport";

const COMMAND_MAP: Record<string, string> = {
  MOVE_TO: "GOTO",
  STOP: "STOP",
  TAKEOFF: "TAKEOFF",
  LAND: "LAND",
  NAVIGATE_PATH: "PATH",
};

export class SerialMotorController extends SerialPortDriver {
  constructor(id = "motor-001", name = "SerialMotor", transport?: SerialTransport) {
    super(id, name, transport ?? new MemorySerialTransport());
  }

  async executeCommand(command: string, params: Record<string, unknown>): Promise<void> {
    const opcode = COMMAND_MAP[command] ?? command;
    const payload = JSON.stringify({ cmd: opcode, params });
    const frame = new TextEncoder().encode(`${payload}\n`);
    if (this.status !== HardwareStatus.CONNECTED) {
      throw new Error(`Serial motor ${this.name} is not connected`);
    }
    await this.send(frame);
  }
}

export class SerialMotorActuator implements Actuator {
  type = CapabilityType.MOTION;
  name: string;
  specs: Record<string, unknown>;

  constructor(private readonly driver: SerialMotorController) {
    this.name = driver.name;
    this.specs = { protocol: "serial-text", driverId: driver.id };
  }

  async execute(command: string, params: Record<string, unknown>): Promise<void> {
    return this.driver.executeCommand(command, params);
  }
}
