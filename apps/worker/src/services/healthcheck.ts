import type { EnvSource } from "@newsflow/config";
import { Redis } from "@upstash/redis";
import {
  resolveOpenAIEnv,
  resolvePerplexityEnv,
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
  const perplexity = resolvePerplexityEnv(source);
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
        perplexityConfigured: Boolean(perplexity.perplexityApiKey),
        redisUrl: redis.redisUrl,
        upstashRestConfigured: Boolean(upstashRest),
        workerPollCron: runtime.workerPollCron,
        topicDialogueModel: runtime.topicDialogueModel,
        newsSearchModel: runtime.newsSearchModel,
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
