#!/usr/bin/env node

import { Command } from "commander";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";
import { logger, LogLevel } from "../../atlas-runtime/Logging/Logger";
import { Configuration } from "../../atlas-runtime/Configuration/Configuration";
import { FleetTelemetry } from "../../atlas-fleet/Telemetry/FleetTelemetry";

const program = new Command();

program
  .name("atlas")
  .description("Universal software platform for intelligent machines")
  .version("1.0.0");

// Run command
program
  .command("run")
  .description("Start the Atlas runtime")
  .option("-c, --config <path>", "Path to configuration file", "config.json")
  .option("-v, --verbose", "Enable verbose logging")
  .action(async (options) => {
    console.log("⚡ Starting Atlas runtime...");

    // Set log level
    if (options.verbose) {
      logger.setLevel(LogLevel.DEBUG);
      logger.debug("CLI", "Verbose logging enabled");
    }

    // Initialize runtime
    const runtime = new AtlasRuntime();
    const config = new Configuration({ path: options.config });

    logger.info("CLI", `Using config file: ${options.config}`);
    console.log("🚀 Atlas runtime running! Press Ctrl+C to stop");

    // Start the runtime
    runtime.start();

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n🛑 Stopping Atlas runtime...");
      process.exit(0);
    });

    // Keep process alive
    setInterval(() => {}, 1000);
  });

// Status command
program
  .command("status")
  .description("Check runtime and system status")
  .option("-c, --config <path>", "Path to configuration file", "config.json")
  .action(async (options) => {
    console.log("📊 Atlas System Status");
    console.log("------------------------");
    console.log("✅ Configuration loaded from:", options.config);
    console.log("🔧 Log level:", logger.getLevel ? LogLevel[logger.getLevel()] : "INFO");
    console.log("\n💡 Tip: Use 'atlas run' to start the full runtime!");
  });

// Config command
program
  .command("config")
  .description("Manage runtime configuration")
  .option("-s, --set <key=value>", "Set configuration value (key=value)")
  .option("-g, --get <key>", "Get configuration value for key")
  .option("-l, --list", "List all configuration values")
  .option("-c, --config <path>", "Path to configuration file", "config.json")
  .action(async (options) => {
    const config = new Configuration({ path: options.config });

    if (options.set) {
      const [key, ...valueParts] = options.set.split("=");
      const value = valueParts.join("=");
      config.set(key, value);
      config.save();
      console.log(`✅ Set ${key} = ${value}`);
    } else if (options.get) {
      const value = config.get(options.get);
      console.log(`${options.get} =`, value);
    } else if (options.list) {
      console.log("📋 Configuration:");
      const all = config.getAll();
      for (const [k, v] of Object.entries(all)) {
        console.log(`  ${k}:`, v);
      }
    } else {
      console.log("ℹ️ Use --set, --get, or --list options!");
    }
  });

// Telemetry command
program
  .command("telemetry")
  .description("Manage and view fleet telemetry")
  .option("-l, --list", "List all registered nodes")
  .option("-h, --health", "Show fleet health summary")
  .action(async (options) => {
    const telemetry = new FleetTelemetry();

    if (options.list) {
      console.log("📦 Registered Nodes:");
      const nodes = telemetry.getNodeStatus() as any[];
      if (nodes.length === 0) {
        console.log("  (no nodes registered yet)");
      } else {
        nodes.forEach((node) => {
          console.log(`  - ${node.name} (${node.id}): ${node.status}`);
        });
      }
    } else if (options.health) {
      console.log("🏥 Fleet Health:");
      console.log(`  Overall: ${(telemetry.getFleetHealth() * 100).toFixed(1)}%`);
    } else {
      console.log("ℹ️ Use --list or --health options!");
    }
  });

// Simulate command
program
  .command("simulate")
  .description("Run a simple simulation")
  .option("-d, --duration <seconds>", "Simulation duration", "10")
  .option("-n, --nodes <count>", "Number of simulated nodes", "3")
  .action(async (options) => {
    const duration = parseInt(options.duration);
    const numNodes = parseInt(options.nodes);
    console.log(`🧪 Starting simulation (${duration}s, ${numNodes} nodes)...`);

    // Create fleet telemetry and add simulated nodes
    const telemetry = new FleetTelemetry();
    for (let i = 0; i < numNodes; i++) {
      telemetry.registerNode({
        id: `node-${i}`,
        name: `Simulated Node ${i}`,
        status: "online",
        health: { battery: 0.8 + Math.random() * 0.2, cpu: 0.3 + Math.random() * 0.3, memory: 0.5 + Math.random() * 0.3, overall: 0.85 },
        timestamp: Date.now()
      });
    }

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 1;
      console.log(`⏱️  Simulation: ${elapsed}s elapsed...`);
      if (elapsed >= duration) {
        clearInterval(interval);
        console.log("✅ Simulation complete!");
        console.log("\n🏥 Simulation Summary:");
        console.log(`- Nodes: ${numNodes}`);
        console.log(`- Fleet Health: ${(telemetry.getFleetHealth() * 100).toFixed(1)}%`);
      }
    }, 1000);
  });

// Doctor command
program
  .command("doctor")
  .description("Check system health and dependencies")
  .action(async () => {
    console.log("🏥 Atlas System Check");
    console.log("========================");

    // Check Node.js version
    console.log(`✅ Node.js: ${process.version}`);

    // Check TypeScript
    try {
      const tsVersion = require("typescript").version;
      console.log(`✅ TypeScript: ${tsVersion}`);
    } catch (e) {
      console.log("❌ TypeScript: Not installed");
    }

    // Check Jest
    try {
      const jestVersion = require("jest").version;
      console.log(`✅ Jest: ${jestVersion}`);
    } catch (e) {
      console.log("❌ Jest: Not installed");
    }

    // Check Commander
    try {
      const commanderVersion = require("commander").version;
      console.log(`✅ Commander.js: ${commanderVersion}`);
    } catch (e) {
      console.log("❌ Commander.js: Not installed");
    }

    console.log("\n✅ System check complete!");
  });

program.parse();
