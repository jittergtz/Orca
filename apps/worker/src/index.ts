import { createServer, IncomingMessage, ServerResponse } from "http";
import { closeWorkerRuntime, createWorkers, enqueueFetchNews } from "./queue";
import { logger } from "./lib/logger";
import { startScheduler } from "./scheduler";
import { resolveWorkerRuntimeEnv } from "./lib/env";
import { executeFetchPipeline } from "./services/pipeline";

async function bootstrap() {
  const {
    port,
    workerAuthToken,
    workerSchedulerEnabled,
    workerQueueEnabled,
    workerAudioQueueEnabled,
    workerManualTriggerMode,
  } = resolveWorkerRuntimeEnv();
  const runtime = workerQueueEnabled ? createWorkers() : null;
  const scheduler = workerSchedulerEnabled && workerQueueEnabled ? startScheduler() : null;

  if (!workerSchedulerEnabled) {
    logger.info("Worker scheduler disabled");
  }

  if (!workerQueueEnabled) {
    logger.info("Worker queue disabled");
  }

  if (workerQueueEnabled && !workerAudioQueueEnabled) {
    logger.info("Worker audio queue disabled");
  }

  if (workerSchedulerEnabled && !workerQueueEnabled) {
    logger.warn("Worker scheduler requires the queue and was not started");
  }

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
      return;
    }

    if (req.method === "POST" && req.url === "/trigger-fetch") {
      const authHeader = req.headers["authorization"] ?? "";
      if (workerAuthToken && authHeader !== `Bearer ${workerAuthToken}`) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }

      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const payload = JSON.parse(body);
          if (!payload.topicId) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "topicId is required" }));
            return;
          }

          logger.info("Manual fetch trigger received", {
            topicId: payload.topicId,
            initiatedBy: payload.initiatedBy ?? "manual",
            mode: workerManualTriggerMode,
          });

          const jobData = {
            topicId: payload.topicId,
            initiatedBy: (payload.initiatedBy as "manual" | "schedule") ?? "manual",
          };

          const result =
            workerManualTriggerMode === "inline"
              ? await executeFetchPipeline(jobData, undefined, { inlineSummarize: true })
              : await enqueueFetchNews(jobData);

          res.writeHead(200);
          res.end(JSON.stringify({
            ok: true,
            topicId: payload.topicId,
            mode: workerManualTriggerMode,
            result,
            message:
              workerManualTriggerMode === "inline"
                ? "Fetch pipeline completed inline"
                : "Fetch job enqueued",
          }));
        } catch (error) {
          logger.error("Failed to enqueue fetch job", {
            error: error instanceof Error ? error.message : String(error),
          });
          res.writeHead(500);
          res.end(JSON.stringify({
            error: "Failed to enqueue fetch job",
            message: error instanceof Error ? error.message : String(error),
          }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  });

  server.listen(port, () => {
    logger.info(`Worker HTTP server listening on port ${port}`);
  });

  const shutdown = async () => {
    scheduler?.stop();
    if (runtime) {
      await closeWorkerRuntime(runtime);
    }
    server.close();
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
