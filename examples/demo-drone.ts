import { Atlas } from "../atlas-api";

async function main() {
  const atlas = new Atlas({ autoStart: false });

  atlas.on("DRONE_TAKEOFF", (e) => {
    const p = e.payload as any;
    console.log(`  Altitude: ${p.altitude?.toFixed(1)}m / ${p.targetAltitude}m`);
  });
  atlas.on("DRONE_FLY_TO", (e) => {
    const p = e.payload as any;
    console.log(`  En route: ${(p.progress * 100).toFixed(0)}%`);
  });
  atlas.on("DRONE_LAND", (e) => {
    const p = e.payload as any;
    console.log(`  Descending: ${(p.progress * 100).toFixed(0)}%`);
  });

  atlas.start();

  const drone = atlas.drone("quad", { name: "Scout" });
  console.log("🚁 Scout Drone ready\n");

  console.log("1. Takeoff to 20m");
  await drone.takeoff(20);

  console.log("\n2. Fly to target");
  await drone.flyTo({ latitude: 37.78, longitude: -122.42, altitude: 25 });

  console.log("\n3. Capture aerial image");
  const img = await drone.captureImage();
  console.log(`   Captured ${img.width}x${img.height}`);

  console.log("\n4. Return home");
  await drone.returnHome();

  const s = drone.getStatus();
  console.log(`\nStatus: ${s.mode}, batt ${s.battery}%`);

  atlas.stop();
  console.log("\nMission complete.");
}

main().catch(console.error);
