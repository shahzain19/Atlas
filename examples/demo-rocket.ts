import { Atlas } from "../atlas-api";

async function main() {
  const atlas = new Atlas({ autoStart: false });

  atlas.on("GPS_UPDATE", (e) => {
    const p = e.payload as any;
    const alt = p.z?.toFixed(1);
    console.log(`  Altitude: ${alt}m  |  Pos: ${p.x?.toFixed(4)}, ${p.y?.toFixed(4)}`);
  });
  atlas.on("DRONE_TAKEOFF", (e) => {
    const p = e.payload as any;
    console.log(`  Ascending: ${(p.progress * 100).toFixed(0)}% to ${p.targetAltitude}m`);
  });
  atlas.on("DRONE_LAND", (e) => {
    const p = e.payload as any;
    console.log(`  Descent: ${(p.progress * 100).toFixed(0)}%`);
  });

  atlas.start();

  const rocket = atlas.drone("rocket-1", { name: "Atlas-I" });

  console.log("=== Rocket Launch & Reentry Mission ===");
  console.log("Location: Cape Canaveral, FL (28.5619°N, 80.5770°W)");
  console.log("Vehicle: Atlas-I Heavy Lift Rocket\n");

  // Pre-launch
  console.log("T-00:00 — Launch sequence initiated");
  console.log("Ignition...\n");

  // Takeoff (launch)
  console.log("Phase 1 — LIFTOFF!");
  console.log("First stage: 3x Merlin engines at full throttle");
  await rocket.takeoff(100);

  // Stage 1 separation and boost
  console.log("\nPhase 2 — Stage separation");
  await rocket.flyTo({ latitude: 28.5619, longitude: -80.5770, altitude: 200 });
  console.log("First stage separation confirmed");
  console.log("Second stage ignition");

  // Orbital insertion
  console.log("\nPhase 3 — Orbit insertion");
  await rocket.flyTo({ latitude: 28.5650, longitude: -80.5750, altitude: 500 });
  const imgSpace = await rocket.captureImage();
  console.log(`  Earth observation: ${imgSpace.width}x${imgSpace.height}px`);

  // Payload deploy
  console.log("\nPhase 4 — Payload deployment");
  await rocket.flyTo({ latitude: 28.5700, longitude: -80.5700, altitude: 800 });
  console.log("  Satellite separated, orbit nominal");

  // De-orbit burn
  console.log("\nPhase 5 — De-orbit burn");
  await rocket.flyTo({ latitude: 28.5550, longitude: -80.5820, altitude: 400 });
  console.log("  Retro-burn complete");

  // Reentry
  console.log("\nPhase 6 — Atmospheric reentry");
  console.log("  Heat shield nominal, plasma blackout");
  await rocket.flyTo({ latitude: 28.5510, longitude: -80.5850, altitude: 100 });

  // Landing burn
  console.log("\nPhase 7 — Landing burn");
  await rocket.flyTo({ latitude: 28.5480, longitude: -80.5880, altitude: 50 });

  // Touchdown
  console.log("\nPhase 8 — Touchdown!");
  await rocket.land();

  const status = rocket.getStatus();
  console.log(`\nLaunch manifest complete.`);
  console.log(`Vehicle status: ${status.mode}`);
  console.log(`Final position: (${status.position.x?.toFixed(4)}, ${status.position.y?.toFixed(4)})`);

  atlas.stop();
}

main().catch(console.error);
