import type { EnvSource } from "@newsflow/config";
import { Redis } from "@upstash/redis";
import {
  getEnvValue,
  resolveRedisEnv,
} from "@newsflow/config";
import { resolveWorkerRuntimeEnv } from "../lib/env";
import { createRedisConnection } from "../queue";

function hasEnvValue(source: EnvSource | undefined, keys: string[]) {
  return Boolean(getEnvValue(keys, source));
}

export async function runHealthcheck(source?: EnvSource) {
  const runtime = resolveWorkerRuntimeEnv(source);
  const supabaseUrlConfigured = hasEnvValue(
    source,
    ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL"]
  );
  const serviceRoleConfigured = hasEnvValue(source, ["SUPABASE_SERVICE_ROLE_KEY"]);
  const openaiConfigured = hasEnvValue(source, ["OPENAI_API_KEY"]);
  const serperConfigured = hasEnvValue(source, ["SERPER_API_KEY"]);
  let redisConfigured = hasEnvValue(source, ["UPSTASH_REDIS_URL", "REDIS_URL"]);
  let redisPing: string | null = null;
  let upstashRestPing: unknown = null;

  if (runtime.workerQueueEnabled) {
    const redis = resolveRedisEnv(source);
    redisConfigured = Boolean(redis.redisUrl);
    const connection = createRedisConnection(source);
    const upstashRest =
      runtime.upstashRestUrl && runtime.upstashRestToken
        ? new Redis({
            url: runtime.upstashRestUrl,
            token: runtime.upstashRestToken,
          })
        : null;

    try {
      redisPing = await connection.ping();
      upstashRestPing = upstashRest ? await upstashRest.ping() : null;
    } finally {
      await connection.quit();
    }
  }

  const externalReady =
    !runtime.workerExternalCallsEnabled || (openaiConfigured && serperConfigured);
  const redisReady = !runtime.workerQueueEnabled || redisPing === "PONG";

  return {
    ok:
      supabaseUrlConfigured &&
      serviceRoleConfigured &&
      externalReady &&
      redisReady,
    env: {
      supabaseUrlConfigured,
      serviceRoleConfigured,
      openaiConfigured,
      serperConfigured,
      redisConfigured,
      redisRequired: runtime.workerQueueEnabled,
      upstashRestConfigured: Boolean(runtime.upstashRestUrl && runtime.upstashRestToken),
      workerEnvironment: runtime.workerEnvironment,
      workerTestModeEnabled: runtime.workerTestModeEnabled,
      workerQueueEnabled: runtime.workerQueueEnabled,
      workerSchedulerEnabled: runtime.workerSchedulerEnabled,
      workerManualTriggerMode: runtime.workerManualTriggerMode,
      workerExternalCallsEnabled: runtime.workerExternalCallsEnabled,
      workerMemoryIndexingEnabled: runtime.workerMemoryIndexingEnabled,
      workerPollCron: runtime.workerPollCron,
      topicDialogueModel: runtime.topicDialogueModel,
      articleSummaryModel: runtime.articleSummaryModel,
      railwayEnvironment: runtime.railwayEnvironment ?? null,
    },
    redisPing,
    upstashRestPing,
  };
}
