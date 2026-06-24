import cron from "node-cron";
import type { EnvSource } from "@newsflow/config";
import {
  createServiceRoleClient,
  listDueTopics,
} from "@newsflow/db";
import { resolveWorkerRuntimeEnv } from "./lib/env";
import { logger } from "./lib/logger";
import {
  JOB_NAMES,
  createPipelineQueue,
  createRedisConnection,
  fetchNewsJobOptions,
} from "./queue";

export function startScheduler(source?: EnvSource) {
  const { workerPollCron, workerSchedulerMaxDueTopics } = resolveWorkerRuntimeEnv(source);
  let runInProgress = false;

  const task = cron.schedule(workerPollCron, async () => {
    if (runInProgress) {
      logger.warn("Scheduler tick skipped because previous run is still active", {
        workerPollCron,
      });
      return;
    }

    runInProgress = true;

    try {
      const supabase = createServiceRoleClient(source);
      const topics = await listDueTopics(supabase);
      const topicsToQueue = topics.slice(0, workerSchedulerMaxDueTopics);

      logger.info("Scheduler discovered due topics", {
        count: topics.length,
        enqueueCount: topicsToQueue.length,
        maxDueTopics: workerSchedulerMaxDueTopics,
        workerPollCron,
      });

      if (topicsToQueue.length === 0) {
        return;
      }

      const connection = createRedisConnection(source);
      const queue = createPipelineQueue(connection, source);

      try {
        await queue.addBulk(
          topicsToQueue.map(topic => {
            const data = {
              topicId: topic.id,
              initiatedBy: "schedule",
            } as const;

            return {
              name: JOB_NAMES.fetchNews,
              data,
              opts: fetchNewsJobOptions(data),
            };
          })
        );
      } finally {
        await queue.close();
        await connection.quit();
      }
    } catch (error) {
      logger.error("Scheduler run failed", {
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      runInProgress = false;
    }
  });

  return task;
}
