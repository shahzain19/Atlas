import { Atlas } from "../atlas-api";

async function main() {
  const atlas = new Atlas();

  const robot1 = atlas.robot("rover-a", { name: "Alpha" });
  const robot2 = atlas.robot("rover-b", { name: "Beta" });
  const drone1 = atlas.drone("quad-1", { name: "Eye" });

  const fleet = atlas.fleet();
  fleet.register("rover-a", "robot");
  fleet.register("rover-b", "robot");
  fleet.register("quad-1", "drone");

  console.log("🚀 Fleet assembled, deploying mission...");

  await fleet.deploy({
    name: "Perimeter Sweep",
    goals: [
      { description: "Patrol north edge", priority: 1 },
      { description: "Report obstacles", priority: 2 },
    ],
  });

  console.log("\n📡 Broadcasting formation signal...");
  await fleet.broadcast("FORMATION_KEEP", { formation: "line" });

  const status = fleet.monitor();
  console.log(`\nFleet health: ${status.healthy}/${status.total}`);
  console.log(`Members: ${status.members.map((m) => m.id).join(", ")}`);

  atlas.stop();
  console.log("Fleet mission complete.");
}

main().catch(console.error);
