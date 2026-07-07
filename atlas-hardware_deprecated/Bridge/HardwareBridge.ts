import { HardwareAbstractionLayer } from "../HAL/HardwareAbstractionLayer";
import { BaseDriver } from "../Interfaces/BaseDriver";
import { HardwareManager } from "../../atlas-runtime/HardwareManager/HardwareManager";
import { Actuator, Sensor } from "../../atlas-kernel/Hardware/Hardware";
import { NMEAGPSSensor, NMEAGPSSensorAdapter } from "../Drivers/Devices/NMEAGPSSensor";
import { SerialMotorActuator, SerialMotorController } from "../Drivers/Devices/SerialMotorActuator";
import { CppBridgeDaemon, CppGPSSensor, CppMotorActuator, CppCameraSensor } from "./CppBridge";
import { HardwareMode, createTransport } from "../Transport/SerialTransport";

export type { HardwareMode };

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

export interface HardwareStackConfig {
  mode?: HardwareMode;
  gpsPort?: string;
  gpsBaud?: number;
  motorPort?: string;
  motorBaud?: number;
}

export function createDefaultHardwareStack(
  hardwareManager: HardwareManager,
  config: HardwareStackConfig = {}
): {
  hal: HardwareAbstractionLayer;
  bridge: HardwareBridge;
  gps: NMEAGPSSensor;
  gpsSensor: NMEAGPSSensorAdapter;
  motor: SerialMotorController;
  motorActuator: SerialMotorActuator;
} {
  const mode = config.mode || "simulation";
  const hal = new HardwareAbstractionLayer();
  const bridge = new HardwareBridge(hal, hardwareManager);

  const gpsTransport = createTransport(mode, config.gpsPort, config.gpsBaud);
  const gps = new NMEAGPSSensor("gps-001", "NMEAGPS", gpsTransport);
  const gpsSensor = new NMEAGPSSensorAdapter(gps);

  const motorTransport = createTransport(mode, config.motorPort, config.motorBaud);
  const motor = new SerialMotorController("motor-001", "SerialMotor", motorTransport);
  const motorActuator = new SerialMotorActuator(motor);

  bridge.registerBundle({ driver: gps, sensor: gpsSensor });
  bridge.registerBundle({ driver: motor, actuator: motorActuator });

  return { hal, bridge, gps, gpsSensor, motor, motorActuator };
}

export async function tryInitCppBridge(hardwareManager: HardwareManager): Promise<CppBridgeDaemon | null> {
  const daemon = new CppBridgeDaemon();
  try {
    await daemon.start();
    const ping = await daemon.sendCommand("ping");
    if (!ping.ok) throw new Error("Daemon ping failed");

    hardwareManager.registerSensor(new CppGPSSensor(daemon));
    hardwareManager.registerActuator(new CppMotorActuator(daemon));
    hardwareManager.registerSensor(new CppCameraSensor(daemon));

    console.log("[CppBridge] C++ hardware daemon connected");
    return daemon;
  } catch (err) {
    console.warn("[CppBridge] C++ hardware daemon unavailable:", (err as Error).message);
    try { daemon.stop(); } catch { }
    return null;
  }
}
