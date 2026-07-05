import { AtlasRuntime } from "./atlas-runtime/Lifecycle/AtlasRuntime";
import { SystemAgent } from "./atlas-agents/SystemAgent/SystemAgent";
import { TaskAgent } from "./atlas-agents/TaskAgent/TaskAgent";
import { VisionAgent } from "./atlas-agents/VisionAgent/VisionAgent";
import { NavigationAgent } from "./atlas-agents/NavigationAgent/NavigationAgent";
import { tryInitCppBridge } from "./atlas-hardware/Bridge/HardwareBridge";

const atlas = new AtlasRuntime();

// Register Agents
atlas.agents.register(new SystemAgent());
atlas.agents.register(new TaskAgent(atlas));
atlas.agents.register(new VisionAgent(atlas));
atlas.agents.register(new NavigationAgent(atlas));

// Register C++-backed hardware drivers via hardware daemon
void tryInitCppBridge(atlas.hardware).then((daemon) => {
  if (daemon) {
    (globalThis as any).__cppDaemon = daemon;
    console.log("[main] C++ hardware bridge active");
  } else {
    console.log("[main] C++ hardware bridge unavailable, using TS fallback drivers");
  }
});

// ROS2 event bridges
atlas.ros.bridgeEventToTopic("TASK_FAILURE", "/atlas/task_failure", "std_msgs/String");
atlas.ros.bridgeEventToTopic("MISSION_COMPLETED", "/atlas/mission_completed", "std_msgs/String");

// Debug events
atlas.bus.on("TICK", (event) => {
  // console.log(`[EVENT] ${event.type} dt=${event.payload.dt}ms`);
});

atlas.bus.on("TASK_REQUEST", (event) => {
  console.log(
    `[EVENT] Task Requested: ${event.payload.name} [Category: ${event.metadata?.category}, Importance: ${event.metadata?.importance}]`
  );
});

// Start Atlas
atlas.start();

// 🚀 Submit a full mission
setTimeout(async () => {
  console.log("\n--- STARTING MISSION ---");
  await atlas.submitMission({
    id: "mission-001",
    name: "Critical Infrastructure Inspection",
    status: "pending",
    goals: [
      {
        id: "goal-1",
        description: "Inspect Turbine #7",
        priority: 1,
        isCompleted: false,
      },
    ],
  });
  console.log("--- MISSION FINISHED ---\n");
}, 1000);

// 💡 Simulate an external task request after 2 seconds
setTimeout(async () => {
  await atlas.emit({
    type: "TASK_REQUEST",
    timestamp: Date.now(),
    payload: { name: "Autonomous Survey" },
  });
}, 2000);

// 🚨 Simulate a critical failure after 3 seconds
setTimeout(async () => {
  await atlas.emit({
    type: "TASK_FAILURE",
    timestamp: Date.now(),
    payload: { error: "Battery Critical", code: 500 },
  });
}, 3500);

// 📸 Simulate a vision event after 4 seconds
setTimeout(async () => {
  console.log("\n--- SIMULATING VISION EVENT ---");
  await atlas.emit({
    type: "IMAGE_CAPTURED",
    timestamp: Date.now(),
    payload: { camera: "front-depth" },
  });
}, 4000);

// 🛰️ Simulate a GPS update after 4.5 seconds
setTimeout(async () => {
  console.log("\n--- SIMULATING GPS UPDATE ---");
  const coords = await atlas.hardware.readSensor("NMEAGPS");
  
  // Update state
  await atlas.emit({
    type: "GPS_UPDATE",
    source: "NMEAGPS",
    timestamp: Date.now(),
    payload: { x: coords.lat, y: coords.lng, z: coords.alt, uncertainty: 0.1 },
  });

  // Manually emit an object detection with position for SLAM demonstration
  await atlas.emit({
    type: "OBJECT_DETECTED",
    source: "VisionAgent",
    timestamp: Date.now(),
    payload: { 
      object: "Wind Turbine", 
      confidence: 0.95, 
      position: { x: coords.lat + 0.01, y: coords.lng + 0.01, z: coords.alt },
      uncertainty: 0.05 
    },
  });

  const state = atlas.perception.getState();
  console.log(`[Perception] Current State Estimate:`, state.position);
  console.log(`[Perception] Confidence: ${state.confidence.toFixed(2)}`);

  const map = atlas.slam.getMap();
  console.log(`[SLAM] Map Objects:`, map.objects.map(obj => `${obj.label} at x=${obj.position.x.toFixed(2)}`));
}, 4500);

// Keep running (the demo can be interrupted with Ctrl+C)