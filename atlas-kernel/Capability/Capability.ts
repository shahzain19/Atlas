export enum CapabilityType {
  MOTION = "motion",
  SENSING = "sensing",
  COMMUNICATION = "communication",
  COMPUTATION = "computation",
  IMAGING = "imaging",
  STORAGE = "storage",
  MANIPULATION = "manipulation",
  NAVIGATION = "navigation",
}

export interface Capability {
  id: string;
  type: CapabilityType;
  name: string;
  description?: string;
  provider: string;
  specs: Record<string, any>;
  enabled: boolean;
  health: "healthy" | "degraded" | "failed";
}

export interface MotionCapability extends Capability {
  type: CapabilityType.MOTION;
  specs: {
    maxSpeed: number;
    maxAcceleration: number;
    degreesOfFreedom: number;
    [key: string]: any;
  };
  moveTo(params: { x: number; y: number; z?: number }): Promise<void>;
  rotateTo(params: { yaw: number; pitch?: number; roll?: number }): Promise<void>;
  stop(): Promise<void>;
}

export interface SensingCapability extends Capability {
  type: CapabilityType.SENSING;
  specs: {
    sensorType: string;
    updateRate: number;
    range: { min: number; max: number };
    [key: string]: any;
  };
  read(): Promise<any>;
  calibrate?(): Promise<void>;
}

export interface ImagingCapability extends Capability {
  type: CapabilityType.IMAGING;
  specs: {
    resolution: { width: number; height: number };
    fps: number;
    [key: string]: any;
  };
  capture(): Promise<Buffer>;
}

export interface CommunicationCapability extends Capability {
  type: CapabilityType.COMMUNICATION;
  specs: {
    protocol: string;
    bandwidth: number;
    range: number;
    [key: string]: any;
  };
  send(data: any, target?: string): Promise<void>;
  receive(): Promise<any>;
}

export interface ComputationCapability extends Capability {
  type: CapabilityType.COMPUTATION;
  specs: {
    cpuCores: number;
    memoryGB: number;
    gpuAvailable: boolean;
    [key: string]: any;
  };
  execute(task: () => Promise<any>): Promise<any>;
}

export interface StorageCapability extends Capability {
  type: CapabilityType.STORAGE;
  specs: {
    capacityGB: number;
    usedGB: number;
    [key: string]: any;
  };
  read(key: string): Promise<any>;
  write(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface ManipulationCapability extends Capability {
  type: CapabilityType.MANIPULATION;
  specs: {
    reach: number;
    payloadKG: number;
    gripperType: string;
    [key: string]: any;
  };
  grasp(): Promise<void>;
  release(): Promise<void>;
  moveArm(params: { joints: number[] }): Promise<void>;
}

export type AnyCapability =
  | Capability
  | MotionCapability
  | SensingCapability
  | ImagingCapability
  | CommunicationCapability
  | ComputationCapability
  | StorageCapability
  | ManipulationCapability;
