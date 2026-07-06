# Atlas Rust SDK

Connect to the Atlas Runtime from Rust applications.

## Installation

```bash
cd atlas-sdk/Rust
cargo build
```

## Usage

```rust
use atlas_sdk::*;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut client = AtlasClient::new("ws://localhost:8080/api/ws");
    client.connect().await?;

    // Robot
    let robot = Robot::new(client.clone(), "rover-1", "Surveyor");
    robot.navigate_to(&NavigateTarget::Local(Position { x: 37.775, y: -122.418, z: 0.0 })).await?;
    robot.scan().await?;
    robot.explore().await?;

    // Drone
    let drone = Drone::new(client.clone(), "quad-1", "SkyEye");
    drone.takeoff(20.0).await?;
    drone.fly_to(37.7749, -122.4194, 25.0).await?;
    drone.capture_image().await?;
    drone.return_home().await?;

    // Fleet
    let mut fleet = Fleet::new(client.clone());
    fleet.register("rover-1", "robot");
    fleet.register("quad-1", "drone");

    let snapshot = client.get_snapshot().await?;
    println!("Runtime: {:?}", snapshot);

    Ok(())
}
```

## Types

- `AtlasClient` — Async WebSocket client (connect, get_snapshot, start/stop runtime, emit_event, entity registry)
- `Robot` — navigate_to (GPS/local), scan, explore
- `Drone` — takeoff, fly_to, capture_image, return_home, land
- `Fleet` — register, unregister, deploy, broadcast, monitor
- `Entity` — Base entity with metadata
- `Event` — Typed event with serde serialization
- `Config` — JSON config management
