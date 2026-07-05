import { BaseDriver } from "./BaseDriver";
import { HardwareStatus } from "../HAL/HardwareAbstractionLayer";

export enum GPIOMode {
  INPUT = "input",
  OUTPUT = "output",
}

export enum GPIOValue {
  LOW = 0,
  HIGH = 1,
}

export abstract class GPIODriver extends BaseDriver {
  type = "gpio";
  capabilities = ["read", "write"];
  status = HardwareStatus.DISCONNECTED;

  abstract setMode(pin: number, mode: GPIOMode): Promise<void>;
  abstract write(pin: number, value: GPIOValue): Promise<void>;
  abstract read(pin: number): Promise<GPIOValue>;
}
