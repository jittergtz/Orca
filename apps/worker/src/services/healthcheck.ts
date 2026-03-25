import type { EnvSource } from "@newsflow/config";
import {
  resolveOpenAIEnv,
  resolvePerplexityEnv,
  resolvePublicSupabaseEnv,
  resolveRedisEnv,
  resolveServiceRoleSupabaseEnv,
} from "@newsflow/config";
import { createRedisConnection } from "../queue";

export async function runHealthcheck(source?: EnvSource) {
  const supabasePublic = resolvePublicSupabaseEnv(source);
  const supabaseService = resolveServiceRoleSupabaseEnv(source);
  const openai = resolveOpenAIEnv(source);
  const perplexity = resolvePerplexityEnv(source);
  const redis = resolveRedisEnv(source);

  const connection = createRedisConnection(source);

  try {
    const redisPing = await connection.ping();

    return {
      ok: redisPing === "PONG",
      env: {
        supabasePublicUrl: supabasePublic.supabaseUrl,
        supabaseServiceUrl: supabaseService.supabaseUrl,
        openaiConfigured: Boolean(openai.openaiApiKey),
        perplexityConfigured: Boolean(perplexity.perplexityApiKey),
        redisUrl: redis.redisUrl,
      },
      redisPing,
    };
  } finally {
    await connection.quit();
  }
}
