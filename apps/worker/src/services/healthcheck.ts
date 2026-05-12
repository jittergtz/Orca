import type { EnvSource } from "@newsflow/config";
import { Redis } from "@upstash/redis";
import {
  resolveOpenAIEnv,
  resolveSerperEnv,
  resolvePublicSupabaseEnv,
  resolveRedisEnv,
  resolveServiceRoleSupabaseEnv,
} from "@newsflow/config";
import { resolveWorkerRuntimeEnv } from "../lib/env";
import { createRedisConnection } from "../queue";

export async function runHealthcheck(source?: EnvSource) {
  const supabasePublic = resolvePublicSupabaseEnv(source);
  const supabaseService = resolveServiceRoleSupabaseEnv(source);
  const openai = resolveOpenAIEnv(source);
  const serper = resolveSerperEnv(source);
  const redis = resolveRedisEnv(source);
  const runtime = resolveWorkerRuntimeEnv(source);

  const connection = createRedisConnection(source);
  const upstashRest =
    runtime.upstashRestUrl && runtime.upstashRestToken
      ? new Redis({
          url: runtime.upstashRestUrl,
          token: runtime.upstashRestToken,
        })
      : null;

  try {
    const redisPing = await connection.ping();
    const upstashRestPing = upstashRest ? await upstashRest.ping() : null;

    return {
      ok: redisPing === "PONG",
      env: {
        supabasePublicUrl: supabasePublic.supabaseUrl,
        supabaseServiceUrl: supabaseService.supabaseUrl,
        openaiConfigured: Boolean(openai.openaiApiKey),
        serperConfigured: Boolean(serper.serperApiKey),
        redisUrl: redis.redisUrl,
        upstashRestConfigured: Boolean(upstashRest),
        workerPollCron: runtime.workerPollCron,
        topicDialogueModel: runtime.topicDialogueModel,
        articleSummaryModel: runtime.articleSummaryModel,
        railwayEnvironment: runtime.railwayEnvironment ?? null,
      },
      redisPing,
      upstashRestPing,
    };
  } finally {
    await connection.quit();
  }
}
