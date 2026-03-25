import cron from "node-cron";
import type { EnvSource } from "@newsflow/config";
import {
  createServiceRoleClient,
  listDueTopics,
} from "@newsflow/db";
import { enqueueFetchNews } from "./queue";

export function startScheduler(source?: EnvSource) {
  const task = cron.schedule("*/15 * * * *", async () => {
    const supabase = createServiceRoleClient(source);
    const topics = await listDueTopics(supabase);

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
  });

  return task;
}
