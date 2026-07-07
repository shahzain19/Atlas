# C++ Hardware Daemon

## Overview

The hardware daemon (`atlas-hardware-cpp/`) is a native C++20 process that provides real hardware control for Atlas robots. It communicates with the TypeScript/Python runtimes via JSON over stdin/stdout IPC, publishes sensor data over ROS2, and shares camera frames through POSIX shared memory.

## Architecture

```
TypeScript Runtime              Python Runtime
      │                              │
      │      JSON IPC (stdin/      stdout)
      │                              │
      └──────────┬──────────────────┘
                 │
         ┌───────┴────────┐
         │  Hardware      │
         │  Daemon        │
         │  (C++20)       │
         └───┬────────┬───┘
             │        │
             ▼        ▼
       POSIX SHM    ROS2 Topics
    (/dev/shm/)    (/atlas/gps, etc.)
             │
             ▼
       /dev/video0, /dev/ttyUSB0, etc.
```

## Build

```bash
# Without ROS2
cd atlas-hardware-cpp
cmake -S . -B build && cmake --build build -j$(nproc)

# With ROS2 Humble (Ubuntu 22.04)
cmake -S . -B build -DCMAKE_PREFIX_PATH=/opt/ros/humble && \
  cmake --build build -j$(nproc)
```

## Run

```bash
# Direct
./build/atlas_hardware_daemon

# Docker
docker-compose up hardware-daemon

# With environment config
ATLAS_DAEMON_PATH=./atlas-hardware-cpp/build/atlas_hardware_daemon \
ATLAS_HARDWARE_MODE=real \
ATLAS_GPS_PORT=/dev/ttyUSB0 \
ATLAS_MOTOR_PORT=/dev/ttyACM0 \
npx ts-node main.ts
```

## Components

### 1. JSON IPC Protocol

The daemon reads JSON commands from stdin and writes JSON responses to stdout.

**Request format:**
```json
{"cmd": "<command>", "_seq": <number>, ...params}
```

**Response format:**
```json
{"_seq": <number>, "ok": true, "data": <result>}
{"_seq": <number>, "ok": false, "error": "<message>"}
```

**Commands:**

| Command | Params | Description |
|---------|--------|-------------|
| `ping` | — | Health check, returns `"pong"` |
| `list_drivers` | — | List all registered hardware drivers |
| `initialize_all` | — | Initialize all drivers |
| `shutdown_all` | — | Shutdown all drivers |
| `gps_read` | — | Read GPS fix (lat/lng/alt/speed/heading) |
| `gps_ingest` | `sentence: string` | Ingest raw NMEA sentence |
| `motor_exec` | `command, params` | Execute motor command |
| `camera_capture` | — | Capture frame, returns metadata + SHM name |
| `driver_connect` | `id, port` | Connect a driver to a hardware port |

### 2. Shared Memory Camera Frames (Feature 1.4)

Camera frames are transferred via POSIX shared memory instead of being base64-encoded in JSON.

- **SHM name:** `/atlas_camera_frame`
- **Size:** `width * height * 3` (921,600 bytes for 640×480 RGB)
- **Path:** `/dev/shm/atlas_camera_frame` (Linux) or `/dev/shm/` tmpfs

**Flow:**
1. Daemon creates SHM region at startup via `SharedMemoryManager`
2. `camera_capture` writes pixel data to SHM before returning
3. JSON response includes `"shm_name":"/atlas_camera_frame"`
4. TypeScript client reads `/dev/shm/atlas_camera_frame` via `fs.readFileSync()`

**TypeScript usage:**
```typescript
const daemon = new CppBridgeDaemon();
await daemon.start();
const res = await daemon.sendCommand("camera_capture");
if (res.data.shm_name) {
  const buf = require("fs").readFileSync(`/dev/shm${res.data.shm_name}`);
  const pixels = new Uint8Array(buf);
}
```

### 3. Shared Memory Manager API

```cpp
#include "atlas_hardware/Drivers/Device/SharedMemoryManager.h"

atlas::SharedMemoryManager shm("/atlas_my_region");
shm.create(1024 * 1024);   // 1 MB shared region
shm.write(data, size);      // write data to SHM
shm.read(buffer, size);     // read from SHM
// Destructor calls shm_unlink automatically
```

### 4. ROS2 Bridge (Feature 6)

When built with `-DATLAS_HAS_ROS2`, the daemon creates a native ROS2 node.

**Published topics:**

| Topic | Type | Rate | Description |
|-------|------|------|-------------|
| `/atlas/gps` | `sensor_msgs/NavSatFix` | 10 Hz | GPS position fix |
| `/atlas/camera/image_raw` | `sensor_msgs/Image` | 15 Hz | RGB camera frame (rgb8) |
| `/atlas/camera/camera_info` | `sensor_msgs/CameraInfo` | 15 Hz | Camera calibration info |

**Subscribed topics:**

| Topic | Type | Description |
|-------|------|-------------|
| `/atlas/motor/cmd_vel` | `geometry_msgs/Twist` | Velocity command → SerialMotorController |

**Docker build (with ROS2):**
```bash
cd atlas-hardware-cpp
docker build -t atlas-hardware-daemon .
```

### 5. Hardware Drivers

#### V4L2CameraDriver
- Reads from `/dev/video*` via V4L2 ioctls
- Falls back to simulated procedural terrain when no camera is present
- Supports 640×480 RGB capture (configurable via `setResolution`)
- Shares frames via SHM when `setSharedMemory()` is configured

#### NMEAGPSSensor
- Reads NMEA sentences from serial GPS modules
- Parses `$GPGGA`, `$GPRMC` sentences into lat/lng/alt/speed/heading
- Falls back to memory transport in simulation mode

#### SerialMotorController
- Sends text commands over serial to motor controllers
- Commands: `GOTO`, `STOP`, `TAKEOFF`, `LAND`, `PATH`
- Supports JSON-encoded command frames

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ATLAS_DAEMON_PATH` | `atlas-hardware-cpp/build/atlas_hardware_daemon` | Path to daemon binary |
| `ATLAS_HARDWARE_MODE` | `simulation` | `simulation`, `real`, or `hybrid` |
| `ATLAS_GPS_PORT` | — | Serial device for GPS (e.g. `/dev/ttyUSB0`) |
| `ATLAS_MOTOR_PORT` | — | Serial device for motor controller |

## Tests

```bash
cd atlas-hardware-cpp/build
./atlas_hardware_tests
# 57 tests, all pass
```

## Docker

```yaml
# docker-compose.yml
services:
  hardware-daemon:
    build: atlas-hardware-cpp
    devices:
      - /dev/video0:/dev/video0
      - /dev/ttyUSB0:/dev/ttyUSB0
    volumes:
      - /dev/shm:/dev/shm
    tmpfs:
      - /dev/shm:size=64M
    restart: unless-stopped
```
