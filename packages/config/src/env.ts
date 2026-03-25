export type EnvSource = Record<string, string | undefined>;

function defaultEnvSource(): EnvSource {
  return (((globalThis as { process?: { env?: EnvSource } }).process?.env ?? {}) as EnvSource);
}

export function getEnvValue(keys: string[], source: EnvSource = defaultEnvSource()) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

export function requireEnvValue(label: string, keys: string[], source: EnvSource = defaultEnvSource()) {
  const value = getEnvValue(keys, source);

  if (!value) {
    throw new Error(`Missing ${label}. Checked: ${keys.join(", ")}`);
  }

  return value;
}

export function requireUrlEnvValue(label: string, keys: string[], source: EnvSource = defaultEnvSource()) {
  const value = requireEnvValue(label, keys, source);

  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
}

export function resolvePublicSupabaseEnv(source: EnvSource = defaultEnvSource()) {
  return {
    supabaseUrl: requireUrlEnvValue(
      "Supabase URL",
      ["VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"],
      source
    ),
    supabaseAnonKey: requireEnvValue(
      "Supabase anon key",
      ["VITE_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"],
      source
    )
  };
}

export function resolveServiceRoleSupabaseEnv(source: EnvSource = defaultEnvSource()) {
  return {
    supabaseUrl: requireUrlEnvValue(
      "Supabase URL",
      ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL"],
      source
    ),
    serviceRoleKey: requireEnvValue("Supabase service role key", ["SUPABASE_SERVICE_ROLE_KEY"], source)
  };
}

export function resolveOpenAIEnv(source: EnvSource = defaultEnvSource()) {
  return {
    openaiApiKey: requireEnvValue("OpenAI API key", ["OPENAI_API_KEY"], source)
  };
}

export function resolvePerplexityEnv(source: EnvSource = defaultEnvSource()) {
  return {
    perplexityApiKey: requireEnvValue("Perplexity API key", ["PERPLEXITY_API_KEY"], source)
  };
}

export function resolveRedisEnv(source: EnvSource = defaultEnvSource()) {
  return {
    redisUrl: requireUrlEnvValue("Redis URL", ["UPSTASH_REDIS_URL", "REDIS_URL"], source)
  };
}

export function resolveAppEnv(source: EnvSource = defaultEnvSource()) {
  return {
    appUrl:
      getEnvValue(["VITE_APP_URL", "NEXT_PUBLIC_APP_URL"], source) ??
      "http://localhost:3000"
  };
}
