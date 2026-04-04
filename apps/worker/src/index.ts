import { closeWorkerRuntime, createWorkers } from "./queue";
import { logger } from "./lib/logger";
import { startScheduler } from "./scheduler";

async function bootstrap() {
  const runtime = createWorkers();
  const scheduler = startScheduler();

  const shutdown = async () => {
    scheduler.stop();
    await closeWorkerRuntime(runtime);
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });

  process.on("SIGTERM", () => {
    void shutdown();
  });

  logger.info("Orca worker started");
}

void bootstrap();
