import { Actuator, Sensor, CapabilityType } from "../../atlas-kernel/Hardware/Hardware";

export class HardwareManager {
  private actuators: Map<string, Actuator> = new Map();
  private sensors: Map<string, Sensor> = new Map();

  registerActuator(actuator: Actuator): void {
    console.log(`[HardwareManager] Registering Actuator: ${actuator.name} (${actuator.type})`);
    this.actuators.set(actuator.name, actuator);
  }

  registerSensor(sensor: Sensor): void {
    console.log(`[HardwareManager] Registering Sensor: ${sensor.name} (${sensor.type})`);
    this.sensors.set(sensor.name, sensor);
  }

  async executeCommand(name: string, command: string, params: Record<string, any>): Promise<void> {
    const actuator = this.actuators.get(name);
    if (!actuator) throw new Error(`Actuator ${name} not found`);
    
    console.log(`[HardwareManager] Routing command '${command}' to actuator '${name}'`);
    return actuator.execute(command, params);
  }

  /**
   * Dispatches a high-level capability command to the first available actuator of that type.
   */
  async dispatchCapabilityCommand(type: CapabilityType, command: string, params: Record<string, any>): Promise<void> {
    const actuators = this.getActuatorsByType(type);
    if (actuators.length === 0) throw new Error(`No actuators found for capability: ${type}`);
    
    // Simple strategy: use the first available actuator
    const actuator = actuators[0];
    return this.executeCommand(actuator.name, command, params);
  }

  async readSensor(name: string): Promise<any> {
    const sensor = this.sensors.get(name);
    if (!sensor) throw new Error(`Sensor ${name} not found`);
    return sensor.read();
  }

  getActuatorsByType(type: CapabilityType): Actuator[] {
    return Array.from(this.actuators.values()).filter(a => a.type === type);
  }

  getSensorsByType(type: CapabilityType): Sensor[] {
    return Array.from(this.sensors.values()).filter(s => s.type === type);
  }
}
