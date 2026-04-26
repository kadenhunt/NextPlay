import { app } from "./app";

const startServer = (): void => {
  const { config } = require("./config") as typeof import("./config");

  app.listen(config.port, () => {
    console.log(`NextPlay backend listening on port ${config.port}`);
    console.log(
      `Auth backend is ${config.auth.enabled ? "enabled" : "disabled"}`
    );
  });
};

try {
  startServer();
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Unknown startup error";

  console.error(`Failed to start NextPlay backend: ${message}`);
  process.exit(1);
}
