import { createServer, IncomingMessage, ServerResponse } from "http";
import { closeWorkerRuntime, createWorkers, enqueueFetchNews } from "./queue";
import { logger } from "./lib/logger";
import { startScheduler } from "./scheduler";
import { resolveWorkerRuntimeEnv } from "./lib/env";
import { executeFetchPipeline } from "./services/pipeline";

type HttpError = Error & { statusCode?: number };

const manualTriggerTimestamps = new Map<string, number>();

function createHttpError(statusCode: number, message: string): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.writeHead(statusCode);
  res.end(JSON.stringify(payload));
}

function readJsonBody(req: IncomingMessage, limitBytes: number) {
  return new Promise<unknown>((resolve, reject) => {
    let body = "";
    let receivedBytes = 0;
    let settled = false;

    const fail = (error: HttpError) => {
      if (settled) {
        return;
      }

      settled = true;
      reject(error);
    };

    req.on("data", (chunk: Buffer | string) => {
      receivedBytes += Buffer.byteLength(chunk);

      if (receivedBytes > limitBytes) {
        fail(createHttpError(413, "Request body too large"));
        return;
      }

      body += chunk.toString();
    });

    req.on("end", () => {
      if (settled) {
        return;
      }

      settled = true;

      try {
        resolve(body.length > 0 ? JSON.parse(body) : {});
      } catch {
        reject(createHttpError(400, "Request body must be valid JSON"));
      }
    });

    req.on("error", error => {
      fail(error);
    });
  });
}

function readTriggerPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createHttpError(400, "Request body must be a JSON object");
  }

  const record = payload as Record<string, unknown>;
  const topicId = typeof record.topicId === "string" ? record.topicId.trim() : "";

  if (!topicId) {
    throw createHttpError(400, "topicId is required");
  }

  const initiatedBy: "manual" | "schedule" =
    record.initiatedBy === "schedule" || record.initiatedBy === "manual"
      ? record.initiatedBy
      : "manual";

  return { topicId, initiatedBy };
}

function readTriggerCooldown(topicId: string, minIntervalMs: number) {
  if (minIntervalMs <= 0) {
    return null;
  }

  const now = Date.now();
  const lastTriggeredAt = manualTriggerTimestamps.get(topicId);

  if (lastTriggeredAt && now - lastTriggeredAt < minIntervalMs) {
    return Math.ceil((minIntervalMs - (now - lastTriggeredAt)) / 1000);
  }

  manualTriggerTimestamps.set(topicId, now);

  if (manualTriggerTimestamps.size > 1_000) {
    for (const [storedTopicId, timestamp] of manualTriggerTimestamps) {
      if (now - timestamp > minIntervalMs) {
        manualTriggerTimestamps.delete(storedTopicId);
      }
    }
  }

  return null;
}

async function bootstrap() {
  const runtimeEnv = resolveWorkerRuntimeEnv();
  const {
    port,
    workerAuthToken,
    workerEnvironment,
    workerExternalCallsEnabled,
    workerManualTriggerMinIntervalMs,
    workerSchedulerEnabled,
    workerSchedulerRequested,
    workerQueueEnabled,
    workerQueueRequested,
    workerAudioQueueEnabled,
    workerManualTriggerMode,
    workerPipelineConcurrency,
    workerQueueRateLimitDurationMs,
    workerQueueRateLimitMax,
    workerRequestBodyLimitBytes,
    workerTestModeEnabled,
  } = runtimeEnv;
  const runtime = workerQueueEnabled ? createWorkers() : null;
  const scheduler = workerSchedulerEnabled ? startScheduler() : null;

  logger.info("Worker runtime config resolved", {
    environment: workerEnvironment,
    testMode: workerTestModeEnabled,
    queueEnabled: workerQueueEnabled,
    schedulerEnabled: workerSchedulerEnabled,
    manualTriggerMode: workerManualTriggerMode,
    externalCallsEnabled: workerExternalCallsEnabled,
    pipelineConcurrency: workerPipelineConcurrency,
    queueRateLimitMax: workerQueueRateLimitMax,
    queueRateLimitDurationMs: workerQueueRateLimitDurationMs,
    manualTriggerMinIntervalMs: workerManualTriggerMinIntervalMs,
  });

  if (workerQueueRequested && !workerQueueEnabled) {
    logger.warn("Worker queue was requested but not started by runtime safety guards", {
      environment: workerEnvironment,
      testMode: workerTestModeEnabled,
    });
  }

  if (workerSchedulerRequested && !workerSchedulerEnabled) {
    logger.warn("Worker scheduler was requested but not started by runtime safety guards", {
      environment: workerEnvironment,
      queueEnabled: workerQueueEnabled,
      testMode: workerTestModeEnabled,
    });
  }

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
      sendJson(res, 200, {
        status: "ok",
        uptime: process.uptime(),
        runtime: {
          environment: workerEnvironment,
          testMode: workerTestModeEnabled,
          queueEnabled: workerQueueEnabled,
          schedulerEnabled: workerSchedulerEnabled,
          manualTriggerMode: workerManualTriggerMode,
          externalCallsEnabled: workerExternalCallsEnabled,
        },
      });
      return;
    }

    if (req.method === "POST" && req.url === "/trigger-fetch") {
      const authHeader = req.headers["authorization"] ?? "";
      if (workerAuthToken && authHeader !== `Bearer ${workerAuthToken}`) {
        sendJson(res, 401, { error: "Unauthorized" });
        return;
      }

      try {
        const payload = readTriggerPayload(
          await readJsonBody(req, workerRequestBodyLimitBytes)
        );

        if (workerTestModeEnabled) {
          logger.info("Manual fetch trigger accepted in worker test mode", {
            topicId: payload.topicId,
            initiatedBy: payload.initiatedBy,
          });

          sendJson(res, 200, {
            ok: true,
            topicId: payload.topicId,
            mode: "test",
            result: {
              topicId: payload.topicId,
              queued: 0,
              skipped: true,
              reason: "worker_test_mode",
            },
            message: "Worker test mode accepted the trigger without Redis or external API calls",
          });
          return;
        }

        const retryAfterSeconds = readTriggerCooldown(
          payload.topicId,
          workerManualTriggerMinIntervalMs
        );

        if (retryAfterSeconds) {
          res.setHeader("Retry-After", String(retryAfterSeconds));
          sendJson(res, 429, {
            error: "Trigger rate limit exceeded",
            retryAfterSeconds,
          });
          return;
        }

        logger.info("Manual fetch trigger received", {
          topicId: payload.topicId,
          initiatedBy: payload.initiatedBy,
          mode: workerManualTriggerMode,
        });

        const jobData = {
          topicId: payload.topicId,
          initiatedBy: payload.initiatedBy,
        };

        const result =
          workerManualTriggerMode === "inline"
            ? await executeFetchPipeline(jobData, undefined, { inlineSummarize: true })
            : await enqueueFetchNews(jobData);

        sendJson(res, 200, {
          ok: true,
          topicId: payload.topicId,
          mode: workerManualTriggerMode,
          result,
          message:
            workerManualTriggerMode === "inline"
              ? "Fetch pipeline completed inline"
              : "Fetch job enqueued",
        });
      } catch (error) {
        const statusCode =
          error instanceof Error && "statusCode" in error && typeof error.statusCode === "number"
            ? error.statusCode
            : 500;
        const message = error instanceof Error ? error.message : String(error);

        logger.error("Failed to handle fetch trigger", {
          statusCode,
          error: message,
        });
        sendJson(res, statusCode, {
          error: statusCode >= 500 ? "Failed to handle fetch trigger" : message,
          message,
        });
      }
      return;
    }

    sendJson(res, 404, { error: "Not found" });
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
