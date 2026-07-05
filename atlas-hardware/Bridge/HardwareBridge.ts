import { HardwareAbstractionLayer } from "../HAL/HardwareAbstractionLayer";
import { BaseDriver } from "../Interfaces/BaseDriver";
import { HardwareManager } from "../../atlas-runtime/HardwareManager/HardwareManager";
import { Actuator, Sensor } from "../../atlas-kernel/Hardware/Hardware";
import { NMEAGPSSensor, NMEAGPSSensorAdapter } from "../Drivers/Devices/NMEAGPSSensor";
import { SerialMotorActuator, SerialMotorController } from "../Drivers/Devices/SerialMotorActuator";

export interface HardwareDeviceBundle {
  driver: BaseDriver;
  sensor?: Sensor;
  actuator?: Actuator;
}

/**
 * Bridges HAL drivers into the runtime HardwareManager.
 */
export class HardwareBridge {
  constructor(
    private readonly hal: HardwareAbstractionLayer,
    private readonly hardwareManager: HardwareManager
  ) {}

  registerBundle(bundle: HardwareDeviceBundle): void {
    this.hal.registerDriver(bundle.driver);
    if (bundle.sensor) this.hardwareManager.registerSensor(bundle.sensor);
    if (bundle.actuator) this.hardwareManager.registerActuator(bundle.actuator);
  }

  registerDriver(driver: BaseDriver): void {
    this.hal.registerDriver(driver);
  }

  registerSensor(sensor: Sensor): void {
    this.hardwareManager.registerSensor(sensor);
  }

  registerActuator(actuator: Actuator): void {
    this.hardwareManager.registerActuator(actuator);
  }

  async initializeAll(): Promise<void> {
    await this.hal.initializeAll();
  }

  async shutdownAll(): Promise<void> {
    await this.hal.shutdownAll();
  }

  getHAL(): HardwareAbstractionLayer {
    return this.hal;
  }
}

export function createDefaultHardwareStack(hardwareManager: HardwareManager): {
  hal: HardwareAbstractionLayer;
  bridge: HardwareBridge;
  gps: NMEAGPSSensor;
  gpsSensor: NMEAGPSSensorAdapter;
  motor: SerialMotorController;
  motorActuator: SerialMotorActuator;
} {
  const hal = new HardwareAbstractionLayer();
  const bridge = new HardwareBridge(hal, hardwareManager);
  const gps = new NMEAGPSSensor();
  const gpsSensor = new NMEAGPSSensorAdapter(gps);
  const motor = new SerialMotorController();
  const motorActuator = new SerialMotorActuator(motor);

  bridge.registerBundle({ driver: gps, sensor: gpsSensor });
  bridge.registerBundle({ driver: motor, actuator: motorActuator });

  return { hal, bridge, gps, gpsSensor, motor, motorActuator };
}
