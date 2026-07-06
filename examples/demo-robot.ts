import { Atlas } from "../atlas-api";

async function main() {
  const atlas = new Atlas({ autoStart: false });

  atlas.on("GPS_UPDATE", (e) => {
    const p = e.payload as any;
    console.log(`  Pos: ${p.x?.toFixed(4)}, ${p.y?.toFixed(4)}`);
  });
  atlas.on("OBJECT_DETECTED", (e) => {
    const d = e.payload as any;
    console.log(`  Found: ${d.object} (${(d.confidence * 100).toFixed(0)}%)`);
  });

  atlas.start();

  const robot = atlas.robot("rover-1", { name: "Surveyor" });

  console.log("=== Robot Terrain Survey Mission ===");
  console.log("Location: Mojave Desert test site\n");

  // Start position: 35.0116°N, 115.4735°W (Mojave)
  console.log("1. Exploring initial zone");
  await robot.explore();

  console.log("\n2. Scanning for mineral deposits");
  const scan1 = await robot.scan();
  console.log(`   Found ${scan1.objects.length} objects of interest`);

  // Navigate to waypoints
  console.log("\n3. Navigating to waypoint Alpha");
  await robot.navigateTo({ x: 35.0150, y: -115.4700, z: 0 });

  console.log("\n4. Scanning waypoint Alpha");
  const scan2 = await robot.scan();
  console.log(`   Found ${scan2.objects.length} objects`);

  console.log("\n5. Navigating to waypoint Bravo");
  await robot.navigateTo({ x: 35.0080, y: -115.4780, z: 0 });

  console.log("\n6. Final scan at Bravo");
  const scan3 = await robot.scan();
  console.log(`   Found ${scan3.objects.length} objects`);

  const status = robot.getStatus();
  console.log(`\nMission complete.`);
  console.log(`Final position: (${status.position.x?.toFixed(4)}, ${status.position.y?.toFixed(4)})`);
  console.log(`Battery: ${status.battery}%`);

  atlas.stop();
}

main().catch(console.error);
