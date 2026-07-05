import { HardwareStatus } from "../HAL/HardwareAbstractionLayer";

export abstract class BaseDriver {
  abstract id: string;
  abstract name: string;
  abstract type: string;
  abstract status: HardwareStatus;
  abstract capabilities: string[];

  abstract initialize(): Promise<void>;
  abstract shutdown(): Promise<void>;
  abstract reset(): Promise<void>;
  abstract getHealth(): Promise<{ value: number; details: Record<string, unknown> }>;
}
