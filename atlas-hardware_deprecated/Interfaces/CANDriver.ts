import { BaseDriver } from "./BaseDriver";
import { HardwareStatus } from "../HAL/HardwareAbstractionLayer";

export interface CANFrame {
  id: number;
  data: Uint8Array;
  timestamp: number;
  extended?: boolean;
}

export abstract class CANDriver extends BaseDriver {
  type = "can";
  capabilities = ["send", "receive"];
  status = HardwareStatus.DISCONNECTED;

  abstract connect(bus: string, baudRate: number): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sendFrame(frame: CANFrame): Promise<void>;
  abstract setReceiveCallback(callback: (frame: CANFrame) => void): void;
}
