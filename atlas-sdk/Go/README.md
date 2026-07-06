# Atlas Go SDK

Connect to the Atlas Runtime from Go applications.

## Installation

```bash
cd atlas-sdk/Go
go mod tidy
```

## Usage

```go
package main

import (
    "fmt"
    atlas "github.com/atlas-platform/atlas-sdk-go"
)

func main() {
    client := atlas.NewClient(nil, "ws://localhost:8080/api/ws")
    err := client.Connect("")
    if err != nil {
        panic(err)
    }
    defer client.Close()

    // Robot
    robot := atlas.NewRobot(client, "rover-1", "Surveyor")
    robot.NavigateTo(atlas.NavigateTarget{X: 37.775, Y: -122.418, Z: 0})
    robot.Scan()
    robot.Explore()

    // Drone
    drone := atlas.NewDrone(client, "quad-1", "SkyEye")
    drone.Takeoff(20)
    drone.FlyTo(37.7749, -122.4194, 25)
    drone.CaptureImage()
    drone.ReturnHome()
    drone.Land()

    // Fleet
    fleet := atlas.NewFleet(client)
    fleet.Register("rover-1", "robot")
    fleet.Register("quad-1", "drone")
    fleet.Deploy(atlas.MissionDefinition{
        Name: "Perimeter Sweep",
        Goals: []atlas.MissionGoal{
            {Description: "Patrol north edge", Priority: 1},
        },
    })
    fleet.Broadcast("FORMATION_KEEP", nil)
    status := fleet.Monitor()
    fmt.Printf("Fleet health: %d/%d\n", status.Healthy, status.Total)

    // Snapshot
    snapshot, _ := client.GetSnapshot()
    fmt.Printf("Runtime: %v\n", snapshot)
}
```

## Types

- `AtlasClient` — WebSocket client, event emit, entity registry, snapshot
- `Robot` — NavigateTo, Scan, Explore
- `Drone` — Takeoff, FlyTo, CaptureImage, ReturnHome, Land
- `Fleet` — Register, Unregister, Deploy, Broadcast, Monitor
- `Entity` — Base entity with metadata
- `Event` — Typed event with payload
- `Config` — JSON config management
