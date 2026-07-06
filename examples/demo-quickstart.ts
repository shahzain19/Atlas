/**
 * Quickstart demo — get started in under 30 seconds.
 *
 * Run: npx ts-node examples/demo-quickstart.ts
 */
import { Atlas } from "../atlas-api";

async function main() {
  const atlas = new Atlas();
  const robot = atlas.robot();

  // Three lines: explore, scan, navigate
  await robot.explore();
  const scan = await robot.scan();
  await robot.navigateTo({ x: 37.775, y: -122.418, z: 0 });

  console.log(`Found ${scan.objects.length} objects`);
  console.log(`Position: (${robot.getStatus().position.x?.toFixed(4)})`);

  atlas.stop();
}

main().catch(console.error);
