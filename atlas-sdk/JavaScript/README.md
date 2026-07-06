# Atlas JavaScript SDK

Connect to the Atlas Runtime from Node.js applications.

## Installation

```bash
cd atlas-sdk/JavaScript
npm install
```

## Usage

```js
const { AtlasClient, Robot, Drone, Fleet } = require("./index");

async function main() {
  const client = new AtlasClient("ws://localhost:8080/api/ws");
  await client.connect();

  // Robot
  const robot = new Robot(client, "rover-1", "Surveyor");
  await robot.navigateTo({ x: 37.775, y: -122.418, z: 0 });
  await robot.scan();
  await robot.explore();

  // Drone
  const drone = new Drone(client, "quad-1", "SkyEye");
  await drone.takeoff(20);
  await drone.flyTo(37.7749, -122.4194, 25);
  await drone.captureImage();
  await drone.returnHome();

  // Fleet
  const fleet = new Fleet(client);
  fleet.register("rover-1", "robot");
  fleet.register("quad-1", "drone");
  await fleet.deploy({ name: "Survey", goals: [{ description: "Scan area" }] });
  await fleet.broadcast("FORMATION_KEEP");
  console.log(fleet.monitor());

  // Events
  client.on("snapshot", (event) => console.log("State:", event.payload));

  const snap = await client.getSnapshot();
  console.log("Runtime:", snap);

  client.close();
}

main().catch(console.error);
```

## Types

- `AtlasClient` — WebSocket client with connect, send, request, event emit, entity registry
- `Robot` — navigateTo, scan, explore
- `Drone` — takeoff, flyTo, captureImage, returnHome, land
- `Fleet` — register, unregister, deploy, broadcast, monitor
- `Entity` — Base entity with metadata and serialization
- `Event` — Typed event with toDict/fromDict
- `Config` — File-based JSON configuration
