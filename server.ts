import { StudioServer } from "./atlas-runtime/Studio/StudioServer";

async function main() {
  const server = new StudioServer();
  await server.start({ port: 8080, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error("Fatal error starting Studio Server:", err);
  process.exit(1);
});
