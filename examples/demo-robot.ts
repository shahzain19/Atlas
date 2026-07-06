import { Atlas } from "../atlas-api";

async function main() {
  const atlas = new Atlas();

  const robot = atlas.robot();
  console.log("🤖 Robot created");

  await robot.explore();
  console.log("✅ Explore complete");

  const scan = await robot.scan();
  console.log(`📷 Found ${scan.objects.length} objects`);

  const status = robot.getStatus();
  console.log(`📍 Position: (${status.position.x?.toFixed(2)}, ${status.position.y?.toFixed(2)})`);
  console.log(`🔋 Battery: ${status.battery}%`);

  atlas.stop();
  console.log("Done.");
}

main().catch(console.error);
