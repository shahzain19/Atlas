import { BaseDriver } from "./BaseDriver";
import { HardwareStatus } from "../HAL/HardwareAbstractionLayer";

export abstract class SerialDriver extends BaseDriver {
  type = "serial";
  capabilities = ["send", "receive"];
  status = HardwareStatus.DISCONNECTED;

  abstract connect(
    port: string,
    baudRate: number,
    options?: { parity: "none" | "even" | "odd" }
  ): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(data: Uint8Array): Promise<void>;
  abstract setReceiveCallback(callback: (data: Uint8Array) => void): void;
}
