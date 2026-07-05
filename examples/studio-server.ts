import { StudioServer } from "../atlas-runtime/Studio/StudioServer";

const port = Number(process.env.ATLAS_STUDIO_PORT ?? 8080);

const server = new StudioServer();

server
  .start({ port })
  .then(() => {
    console.log("Ready for Atlas Studio connections.");
  })
  .catch((err) => {
    console.error("Failed to start studio server:", err);
    process.exit(1);
  });

process.on("SIGINT", () => {
  void server.stop().then(() => process.exit(0));
});
