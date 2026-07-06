import { Atlas } from "./atlas-api";

async function main() {
  const atlas = new Atlas({ autoStart: true });

  // --- Robot Demo ---
  const robot = atlas.robot("rover-1", { name: "Survey Rover" });

  atlas.on("GPS_UPDATE", (e) => {
    const pos = e.payload as any;
    console.log(`📍 Position: ${pos.x?.toFixed(4)}, ${pos.y?.toFixed(4)}`);
  });

  atlas.on("OBJECT_DETECTED", (e) => {
    const d = e.payload as any;
    console.log(`🔍 Detected: ${d.object} (${(d.confidence * 100).toFixed(0)}%)`);
  });

  console.log("\n--- Exploring area ---");
  await robot.explore();

  console.log("\n--- Scanning environment ---");
  const scan = await robot.scan();
  console.log(`Found ${scan.objects.length} objects`);

  console.log("\n--- Navigating to target ---");
  await robot.navigateTo({ x: 37.775, y: -122.418, z: 0 });

  const status = robot.getStatus();
  console.log(`\n📍 Position: ${status.position.x?.toFixed(4)}, ${status.position.y?.toFixed(4)}`);

  // --- Drone Demo ---
  const drone = atlas.drone("quad-1", { name: "Quad Explorer" });

  console.log("\n--- Drone taking off ---");
  await drone.takeoff(15);

  console.log("\n--- Drone flying to point ---");
  await drone.flyTo({ latitude: 37.78, longitude: -122.42, altitude: 20 });

  console.log("\n--- Drone capturing image ---");
  const img = await drone.captureImage();
  console.log(`Captured ${img.width}x${img.height} — ${img.objects.length} objects detected`);
  for (const o of img.objects) {
    console.log(`   ${o.label} (${(o.confidence * 100).toFixed(0)}%)`);
  }

  console.log("\n--- Drone returning home ---");
  await drone.returnHome();

  // --- Fleet Demo ---
  const fleet = atlas.fleet();
  fleet.register("rover-1", "robot");
  fleet.register("quad-1", "drone");

  const fStatus = fleet.monitor();
  console.log(`\n🚀 Fleet: ${fStatus.healthy}/${fStatus.total} healthy`);

  console.log("\n--- Deploying fleet mission ---");
  await fleet.deploy({
    name: "Area Survey",
    goals: [
      { description: "Survey north quadrant", priority: 1 },
      { description: "Verify no obstacles", priority: 2 },
    ],
  });

  console.log("\n--- Broadcasting fleet signal ---");
  await fleet.broadcast("FORMATION_KEEP");

  console.log(`\n📊 Atlas Status:`, atlas.status);

  if (atlas.active) {
    console.log("\nAtlas running. Press Ctrl+C to stop.");
  }
}

main().catch(console.error);
