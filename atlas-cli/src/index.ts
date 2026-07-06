#!/usr/bin/env node

import { Command } from "commander";
import { Atlas } from "../../atlas-api";
import { logger, LogLevel } from "../../atlas-runtime/Logging/Logger";
import { Configuration } from "../../atlas-runtime/Configuration/Configuration";
import { FleetTelemetry } from "../../atlas-fleet/Telemetry/FleetTelemetry";
import { StudioServer } from "../../atlas-runtime/Studio/StudioServer";

const program = new Command();

program
  .name("atlas")
  .description("Universal platform for intelligent machines")
  .version("1.0.0");

program
  .command("run")
  .description("Start the Atlas runtime")
  .option("-c, --config <path>", "Path to configuration file", "config.json")
  .option("-v, --verbose", "Enable verbose logging")
  .option("-p, --port <port>", "Studio server port", "8080")
  .option("--no-studio", "Skip starting the Studio WebSocket server")
  .action(async (options) => {
    if (options.verbose) {
      logger.setLevel(LogLevel.DEBUG);
    }

    const atlas = new Atlas({ autoStart: true });

    if (options.studio !== false) {
      const server = new StudioServer(atlas.getRuntime() as any);
      await server.start({ port: Number(options.port), host: "0.0.0.0" });
    }

    console.log("🚀 Atlas running. Press Ctrl+C to stop.");
    console.log(`   Status: ${atlas.status.agents} agents, ${atlas.status.tasks} tasks`);

    process.on("SIGINT", () => {
      console.log("\n🛑 Stopping...");
      atlas.stop();
      process.exit(0);
    });

    setInterval(() => {}, 1000);
  });

program
  .command("robot")
  .description("Control a robot: robot <command>")
  .argument("<command>", "explore | scan | navigate | status")
  .argument("[x]", "X coordinate or first arg")
  .argument("[y]", "Y coordinate")
  .action(async (command, x, y) => {
    const atlas = new Atlas({ autoStart: true });
    const robot = atlas.robot();

    switch (command) {
      case "explore":
        console.log("🤖 Exploring...");
        await robot.explore();
        console.log("✅ Done");
        break;
      case "scan":
        console.log("📷 Scanning...");
        const scan = await robot.scan();
        console.log(`Found ${scan.objects.length} objects`);
        scan.objects.forEach((o) =>
          console.log(`  ${o.label} (${(o.confidence * 100).toFixed(0)}%)`)
        );
        break;
      case "navigate":
        await robot.navigateTo({ x: Number(x), y: Number(y), z: 0 });
        console.log(`📍 Navigated to (${x}, ${y})`);
        break;
      case "status":
        const s = robot.getStatus();
        console.log(`Position: (${s.position.x?.toFixed(4)}, ${s.position.y?.toFixed(4)})`);
        console.log(`Battery: ${s.battery}% | Speed: ${s.speed.toFixed(2)} | Mode: ${s.mode}`);
        break;
      default:
        console.log(`Unknown command: ${command}`);
    }
    atlas.stop();
  });

program
  .command("drone")
  .description("Control a drone: drone <command>")
  .argument("<command>", "takeoff | fly | land | capture | return | status")
  .argument("[arg]", "Altitude or latitude")
  .argument("[arg2]", "Longitude")
  .action(async (command, arg, arg2) => {
    const atlas = new Atlas({ autoStart: true });
    const drone = atlas.drone();

    switch (command) {
      case "takeoff":
        await drone.takeoff(Number(arg) || 10);
        console.log(`✅ At altitude ${Number(arg) || 10}m`);
        break;
      case "fly":
        await drone.flyTo({ latitude: Number(arg), longitude: Number(arg2), altitude: 20 });
        console.log(`✅ Flew to (${arg}, ${arg2})`);
        break;
      case "land":
        await drone.land();
        console.log("✅ Landed");
        break;
      case "capture":
        const img = await drone.captureImage();
        console.log(`📸 Captured ${img.width}x${img.height}`);
        break;
      case "return":
        await drone.returnHome();
        console.log("✅ Returned home");
        break;
      case "status":
        const s = drone.getStatus();
        console.log(`Mode: ${s.mode} | Alt: ${s.altitude}m | Batt: ${s.battery}%`);
        break;
      default:
        console.log(`Unknown command: ${command}`);
    }
    atlas.stop();
  });

program
  .command("status")
  .description("Check runtime and system status")
  .option("-c, --config <path>", "Path to configuration file", "config.json")
  .action(async (options) => {
    console.log("📊 Atlas System Status");
    console.log("------------------------");
    console.log(`✅ Config: ${options.config}`);
    console.log(`🔧 Log level: ${logger.getLevel ? LogLevel[logger.getLevel()] : "INFO"}`);
    console.log("\n💡 Commands:");
    console.log("  atlas run          Start runtime + studio server");
    console.log("  atlas robot ...    Control a robot");
    console.log("  atlas drone ...    Control a drone");
    console.log("  atlas simulate     Run simulation");
    console.log("  atlas doctor       Check dependencies");
  });

program
  .command("config")
  .description("Manage runtime configuration")
  .option("-s, --set <key=value>", "Set config value")
  .option("-g, --get <key>", "Get config value")
  .option("-l, --list", "List all config values")
  .option("-c, --config <path>", "Config file path", "config.json")
  .action(async (options) => {
    const config = new Configuration({ path: options.config });

    if (options.set) {
      const [key, ...valueParts] = options.set.split("=");
      config.set(key, valueParts.join("="));
      config.save();
      console.log(`✅ Set ${key} = ${valueParts.join("=")}`);
    } else if (options.get) {
      console.log(`${options.get} =`, config.get(options.get));
    } else if (options.list) {
      console.log("📋 Configuration:");
      for (const [k, v] of Object.entries(config.getAll())) {
        console.log(`  ${k}:`, v);
      }
    }
  });

program
  .command("telemetry")
  .description("View fleet telemetry")
  .option("-l, --list", "List registered nodes")
  .option("-h, --health", "Show fleet health")
  .action(async (options) => {
    const telemetry = new FleetTelemetry();

    if (options.list) {
      console.log("📦 Nodes:");
      const nodes = telemetry.getNodeStatus() as any[];
      if (!nodes.length) console.log("  (none)");
      else nodes.forEach((n) => console.log(`  ${n.name} (${n.id}): ${n.status}`));
    } else if (options.health) {
      console.log(`🏥 Fleet health: ${(telemetry.getFleetHealth() * 100).toFixed(1)}%`);
    }
  });

program
  .command("simulate")
  .description("Run a simulation")
  .option("-d, --duration <seconds>", "Duration", "10")
  .option("-n, --nodes <count>", "Simulated nodes", "3")
  .action(async (options) => {
    const duration = parseInt(options.duration);
    const numNodes = parseInt(options.nodes);
    console.log(`🧪 Simulating ${duration}s with ${numNodes} nodes...`);

    const atlas = new Atlas({ autoStart: true });

    const fleet = atlas.fleet();
    for (let i = 0; i < numNodes; i++) {
      fleet.register(`node-${i}`, "robot");
    }

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed++;
      const status = fleet.monitor();
      process.stdout.write(`\r⏱️  ${elapsed}s · ${status.healthy}/${status.total} healthy`);
      if (elapsed >= duration) {
        clearInterval(interval);
        console.log("\n✅ Simulation complete");
        atlas.stop();
      }
    }, 1000);
  });

program
  .command("doctor")
  .description("Check system dependencies")
  .action(async () => {
    console.log("🏥 Atlas System Check\n");

    const checks: [string, () => string | null][] = [
      ["Node.js", () => process.version],
      ["TypeScript", () => { try { return require("typescript").version; } catch { return null; } }],
      ["Jest", () => { try { return require("jest").version; } catch { return null; } }],
      ["Commander.js", () => { try { return require("commander").version; } catch { return null; } }],
      ["ws", () => { try { return require("ws").version; } catch { return null; } }],
    ];

    let allOk = true;
    for (const [name, fn] of checks) {
      const ver = fn();
      const ok = ver !== null;
      console.log(`${ok ? "✅" : "❌"} ${name}: ${ver || "not found"}`);
      if (!ok) allOk = false;
    }

    // Check Python perception
    try {
      const { execSync } = require("child_process");
      const pyVer = execSync("python3 --version").toString().trim();
      console.log(`✅ Python3: ${pyVer}`);
    } catch {
      console.log("⚠️  Python3: optional, needed for perception");
    }

    console.log(allOk ? "\n✅ All dependencies OK" : "\n⚠️  Some dependencies missing");
  });

program.parse();
