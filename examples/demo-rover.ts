import { Atlas } from "../atlas-api";

async function main() {
  const atlas = new Atlas({ autoStart: false });

  atlas.on("GPS_UPDATE", (e) => {
    const p = e.payload as any;
    console.log(`  Pos: ${p.x?.toFixed(4)}, ${p.y?.toFixed(4)}`);
  });
  atlas.on("OBJECT_DETECTED", (e) => {
    const d = e.payload as any;
    console.log(`  Sample candidate: ${d.object} (${(d.confidence * 100).toFixed(0)}%)`);
  });
  atlas.on("MISSION_COMPLETED", () => {
    console.log("  ✓ Phase complete");
  });

  atlas.start();

  const rover = atlas.robot("rover-1", { name: "Perseverance-II" });

  console.log("=== Rover Planetary Exploration Mission ===");
  console.log("Location: Jezero Crater, Mars (18.4447°N, 77.4508°E)");
  console.log("Objective: Survey delta, collect samples, map terrain\n");

  // Phase 1: Landing site survey
  console.log("Phase 1 — Landing zone survey");
  await rover.navigateTo({ x: 18.4447, y: 77.4508, z: 0 });
  const scan1 = await rover.scan();
  console.log(`  Initial survey: ${scan1.objects.length} features detected`);

  // Phase 2: Delta approach
  console.log("\nPhase 2 — Approach delta formation");
  await rover.navigateTo({ x: 18.4380, y: 77.4600, z: 0 });
  const scan2 = await rover.scan();
  console.log(`  Delta survey: ${scan2.objects.length} geological features`);

  // Phase 3: Sample collection zone
  console.log("\nPhase 3 — Sample collection at ancient shoreline");
  await rover.navigateTo({ x: 18.4300, y: 77.4420, z: 0 });
  const scan3 = await rover.scan();
  console.log(`  Sample zone: ${scan3.objects.length} potential specimens`);

  // Phase 4: Crater rim climb
  console.log("\nPhase 4 — Ascend crater rim");
  await rover.navigateTo({ x: 18.4550, y: 77.4350, z: 0 });
  const scan4 = await rover.scan();
  console.log(`  Rim survey: ${scan4.objects.length} terrain features mapped`);

  // Phase 5: Return to landing site
  console.log("\nPhase 5 — Return to landing site");
  await rover.navigateTo({ x: 18.4447, y: 77.4508, z: 0 });

  const status = rover.getStatus();
  console.log(`\nMission complete.`);
  console.log(`Samples catalogued, rover at ${status.mode}`);
  console.log(`Battery: ${status.battery}%`);

  atlas.stop();
}

main().catch(console.error);
