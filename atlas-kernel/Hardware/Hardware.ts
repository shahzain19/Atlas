export enum CapabilityType {
  MOTION = "motion",
  SENSING = "sensing",
  COMMUNICATION = "communication",
  COMPUTATION = "computation",
  IMAGING = "imaging",
}

export interface HardwareCapability {
  type: CapabilityType;
  name: string;
  specs: Record<string, any>;
}

export interface Actuator extends HardwareCapability {
  execute(command: string, params: Record<string, any>): Promise<void>;
}

export interface Sensor extends HardwareCapability {
  read(): Promise<any>;
}
