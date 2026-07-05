#!/usr/bin/env ts-node
/**
 * Demo: Autonomous Agent Loop
 * Shows the full Observe → Remember → Reason → Plan → Act → Learn cycle
 */
import { AutonomousAgent } from "../atlas-runtime/Autonomy/AutonomousAgent";
import { CameraSensor } from "../atlas-perception/Camera/CameraSensor";
import { LidarSensor } from "../atlas-perception/Lidar/LidarSensor";
import { ObjectDetector } from "../atlas-perception/ObjectDetection/ObjectDetector";

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🤖 ATLAS AUTONOMOUS AGENT DEMO");
  console.log("=".repeat(60) + "\n");

  // Create our autonomous agent
  const agent = new AutonomousAgent("atlas-001", "Atlas Explorer");

  // Attach sensors to the agent
  const camera = new CameraSensor();
  const lidar = new LidarSensor();
  const detector = new ObjectDetector();

  agent.perception.attachCamera(camera);
  agent.perception.attachLidar(lidar);
  agent.perception.attachObjectDetector(detector);

  console.log(`✅ Agent initialized: ${agent.name} (${agent.id})\n`);

  // Start the agent's autonomous loop (cycle every 2 seconds)
  await agent.start(2000);

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n\n" + "=".repeat(60));
    console.log("🛑 SHUTTING DOWN AGENT");
    console.log("=".repeat(60));
    await agent.stop();

    // Print final status
    console.log("\n📊 Final Status:");
    const status = agent.getStatus();
    console.log(`  - Cycles completed: ${status.cycleCount}`);
    console.log(`  - World objects remembered: ${status.worldObjects}`);
    console.log("  - Agent state: IDLE");
    console.log("\n✅ Demo complete!\n");
    process.exit(0);
  });

  // Keep the script running
  console.log("\n🚀 Agent running! Press Ctrl+C to stop.\n");
}

// Run the demo
main().catch(error => {
  console.error("❌ Demo error:", error);
  process.exit(1);
});
