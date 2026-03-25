import cron from "node-cron";
import type { EnvSource } from "@newsflow/config";
import {
  createServiceRoleClient,
  listDueTopics,
} from "@newsflow/db";
import { logger } from "./lib/logger";
import { enqueueFetchNews } from "./queue";

export function startScheduler(source?: EnvSource) {
  const task = cron.schedule("*/15 * * * *", async () => {
    try {
      const supabase = createServiceRoleClient(source);
      const topics = await listDueTopics(supabase);

      logger.info("Scheduler discovered due topics", {
        count: topics.length,
      });

      await Promise.all(
        topics.map(topic =>
          enqueueFetchNews(
            {
              topicId: topic.id,
              initiatedBy: "schedule",
            },
            source
          )
        )
      );
    } catch (error) {
      logger.error("Scheduler run failed", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return task;
}
