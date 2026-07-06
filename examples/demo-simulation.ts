/**
 * Starts the Atlas runtime with Studio server for the simulation to connect to.
 *
 * Run simulation separately: cd atlas-simulation && npx vite
 *
 * Then open http://localhost:5174 in your browser to see the 3D sim.
 */
import { Atlas } from "../atlas-api";
import { StudioServer } from "../atlas-runtime/Studio/StudioServer";

async function main() {
  const atlas = new Atlas({ autoStart: true });

  const server = new StudioServer(atlas.getRuntime() as any);
  await server.start({ port: 8080, host: "0.0.0.0" });

  console.log("Atlas runtime + Studio server ready on :8080");
  console.log("Start simulation: cd atlas-simulation && npx vite");
  console.log("Start studio:     cd atlas-studio && npx vite");
  console.log("Press Ctrl+C to stop.");
}

main().catch(console.error);
