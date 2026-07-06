import { Atlas } from "../atlas-api";

async function main() {
  const atlas = new Atlas({ autoStart: false });

  atlas.on("GPS_UPDATE", (e) => {
    const p = e.payload as any;
    console.log(`  Pos: ${p.x?.toFixed(4)}, ${p.y?.toFixed(4)} @ ${p.z?.toFixed(1)}m`);
  });
  atlas.on("OBJECT_DETECTED", (e) => {
    const d = e.payload as any;
    console.log(`  Watched: ${d.object} (${(d.confidence * 100).toFixed(0)}% confidence)`);
  });
  atlas.on("IMAGE_CAPTURED", (e) => {
    const p = e.payload as any;
    console.log(`  📷 Image ${p.camera} cam`);
  });

  atlas.start();

  const pigeon = atlas.drone("pigeon-1", { name: "Sentry" });

  console.log("=== Surveillance Pigeon Loiter Mission ===");
  console.log("Location: Washington DC, National Mall");
  console.log("Objective: Persistent aerial surveillance, pattern-of-life analysis\n");

  // Silent launch from rooftop (low altitude, bird-like)
  console.log("1. Silent takeoff to 30m");
  await pigeon.takeoff(30);

  // Phase 1: Approach target area
  console.log("\n2. Approach target zone (Washington Monument)");
  await pigeon.flyTo({ latitude: 38.8895, longitude: -77.0353, altitude: 40 });

  console.log("\n3. Loiter pattern - Capture reconnaissance imagery");
  for (let i = 0; i < 3; i++) {
    await pigeon.flyTo({
      latitude: 38.8895 + (i * 0.001),
      longitude: -77.0353 + (i * 0.001),
      altitude: 45 + (i * 5),
    });
    const img = await pigeon.captureImage();
    console.log(`   Pass ${i + 1}/3: ${img.width}x${img.height}px reconnaissance frame`);
  }

  // Phase 2: Observe restricted area
  console.log("\n4. Observing south wing (Capitol area)");
  await pigeon.flyTo({ latitude: 38.8898, longitude: -77.0089, altitude: 50 });
  const imgCapitol = await pigeon.captureImage();
  console.log(`   Capitol imagery: ${imgCapitol.width}x${imgCapitol.height}px`);

  // Phase 3: Return to rooftop silently
  console.log("\n5. Silent return to home position");
  await pigeon.returnHome();

  const status = pigeon.getStatus();
  console.log(`\nPatrol complete. ${status.mode}, batt ${status.battery}%`);

  atlas.stop();
}

main().catch(console.error);
