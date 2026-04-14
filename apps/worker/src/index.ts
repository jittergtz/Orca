import { createServer, IncomingMessage, ServerResponse } from "http";
import { closeWorkerRuntime, createWorkers, enqueueFetchNews } from "./queue";
import { logger } from "./lib/logger";
import { startScheduler } from "./scheduler";
import { resolveWorkerRuntimeEnv } from "./lib/env";

async function bootstrap() {
  const runtime = createWorkers();
  const scheduler = startScheduler();
  const { port, workerAuthToken } = resolveWorkerRuntimeEnv();

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
          });

          await enqueueFetchNews({
            topicId: payload.topicId,
            initiatedBy: (payload.initiatedBy as "manual" | "schedule") ?? "manual",
          });

          res.writeHead(200);
          res.end(JSON.stringify({
            ok: true,
            topicId: payload.topicId,
            message: "Fetch job enqueued",
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
    scheduler.stop();
    await closeWorkerRuntime(runtime);
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
