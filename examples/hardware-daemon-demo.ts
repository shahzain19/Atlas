import { CppBridgeDaemon, CppGPSSensor, CppMotorActuator, CppCameraSensor } from "../atlas-hardware_deprecated/Bridge/CppBridge";
import { AtlasRuntime } from "../atlas-runtime/Lifecycle/AtlasRuntime";

/**
 * Hardware Daemon Demo
 *
 * Demonstrates:
 *   1. Starting the C++ hardware daemon via the TypeScript bridge
 *   2. Reading GPS data from the daemon
 *   3. Capturing camera frames via shared memory
 *   4. Sending motor commands
 *   5. Running the AtlasRuntime with real hardware mode
 *
 * Usage:
 *   npx ts-node examples/hardware-daemon-demo.ts
 *
 * Environment:
 *   ATLAS_DAEMON_PATH  - Path to daemon binary (optional)
 *   ATLAS_HARDWARE_MODE - "simulation" (default), "real", or "hybrid"
 */

async function demoRawBridge() {
  console.log("\n=== 1. Raw Bridge Demo ===");

  const daemon = new CppBridgeDaemon();
  await daemon.start();
  console.log("Daemon started");

  // Ping
  const ping = await daemon.sendCommand("ping");
  console.log("Ping:", ping.ok ? "alive" : "dead");

  // List drivers
  const drivers = await daemon.sendCommand("list_drivers");
  console.log("Drivers:", JSON.stringify(drivers.data, null, 2));

  // Read GPS
  const gps = new CppGPSSensor(daemon);
  try {
    const fix = await gps.read();
    console.log(`GPS: ${fix.lat}, ${fix.lng} (alt=${fix.alt}m)`);
  } catch (e) {
    console.log("GPS:", (e as Error).message);
  }

  // Capture camera frame (metadata + SHM pixels)
  const camera = new CppCameraSensor(daemon);
  try {
    const frame = await camera.read();
    console.log(`Camera: ${frame.width}x${frame.height}`,
      frame.pixels ? `(${frame.pixels.length} px via SHM)` : "(metadata only)");
  } catch (e) {
    console.log("Camera:", (e as Error).message);
  }

  // Send motor command
  const motor = new CppMotorActuator(daemon);
  try {
    await motor.execute("MOVE_TO", { x: 1.0, y: 0.5, z: 0.0 });
    console.log("Motor: MOVE_TO sent");
  } catch (e) {
    console.log("Motor:", (e as Error).message);
  }

  await daemon.stop();
  console.log("Daemon stopped");
}

async function demoAtlasRuntime() {
  console.log("\n=== 2. AtlasRuntime with Hardware Mode ===");

  // Start runtime — reads ATLAS_HARDWARE_MODE env var automatically
  const runtime = new AtlasRuntime({
    hardwareMode: (process.env.ATLAS_HARDWARE_MODE as any) || "simulation",
  });

  await runtime.start();
  console.log("Runtime started, hardware mode:", process.env.ATLAS_HARDWARE_MODE || "simulation");

  // The C++ daemon was auto-connected in runtime.start()
  // Sensor/actuator reads now go through the daemon when available

  await runtime.stop();
  console.log("Runtime stopped");
}

async function main() {
  try {
    await demoRawBridge();
  } catch (e) {
    console.error("Raw bridge demo failed:", (e as Error).message);
  }

  try {
    await demoAtlasRuntime();
  } catch (e) {
    console.error("Runtime demo failed:", (e as Error).message);
  }
}

main().catch(console.error);
