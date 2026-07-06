import { Atlas } from "../atlas-api";

async function main() {
  const atlas = new Atlas({ autoStart: false });

  atlas.on("GPS_UPDATE", (e) => {
    const p = e.payload as any;
    console.log(`  GPS: ${p.x?.toFixed(4)}, ${p.y?.toFixed(4)} @ ${p.z?.toFixed(1)}m`);
  });
  atlas.on("OBJECT_DETECTED", (e) => {
    const d = e.payload as any;
    console.log(`  Detected: ${d.object} (${(d.confidence * 100).toFixed(0)}%)`);
  });

  atlas.start();

  const drone = atlas.drone("quad-1", { name: "SkyEye" });

  console.log("=== Drone Aerial Survey Mission ===");
  console.log("Location: Golden Gate Bridge, San Francisco\n");

  // Takeoff from the bridge's south vista point
  console.log("1. Takeoff to 50m");
  await drone.takeoff(50);

  // Fly to the north tower
  console.log("\n2. Fly to north tower");
  await drone.flyTo({ latitude: 37.8199, longitude: -122.4783, altitude: 60 });

  // Survey the bridge deck
  console.log("\n3. Capture bridge deck imagery");
  const img1 = await drone.captureImage();
  console.log(`   Image: ${img1.width}x${img1.height} @ north tower`);

  // Fly to the south tower
  console.log("\n4. Fly to south tower");
  await drone.flyTo({ latitude: 37.8079, longitude: -122.4755, altitude: 55 });

  console.log("\n5. Capture south tower imagery");
  const img2 = await drone.captureImage();
  console.log(`   Image: ${img2.width}x${img2.height} @ south tower`);

  // Return home
  console.log("\n6. Returning to home base");
  await drone.returnHome();

  const status = drone.getStatus();
  console.log(`\nMission complete. Status: ${status.mode}, batt ${status.battery}%`);

  atlas.stop();
}

main().catch(console.error);
