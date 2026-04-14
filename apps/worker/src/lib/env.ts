import { type EnvSource, resolveSerperEnv } from "@newsflow/config";

export interface WorkerRuntimeEnv {
  workerPollCron: string;
  topicDialogueModel: string;
  articleSummaryModel: string;
  serperApiKey: string;
  workerAuthToken?: string;
  upstashRestUrl?: string;
  upstashRestToken?: string;
  railwayEnvironment?: string;
  port: number;
}

function defaultEnvSource(): EnvSource {
  return (((globalThis as { process?: { env?: EnvSource } }).process?.env ?? {}) as EnvSource);
}

export function readEnvValue(source: EnvSource, key: string) {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function resolveWorkerRuntimeEnv(source: EnvSource = defaultEnvSource()): WorkerRuntimeEnv {
  const { serperApiKey } = resolveSerperEnv(source);

  return {
    workerPollCron: readEnvValue(source, "WORKER_POLL_CRON") ?? "*/15 * * * *",
    topicDialogueModel: readEnvValue(source, "TOPIC_DIALOGUE_MODEL") ?? "gpt-4o",
    articleSummaryModel: readEnvValue(source, "ARTICLE_SUMMARY_MODEL") ?? "gpt-4o-mini",
    serperApiKey,
    workerAuthToken: readEnvValue(source, "WORKER_AUTH_TOKEN"),
    upstashRestUrl: readEnvValue(source, "UPSTASH_REDIS_REST_URL"),
    upstashRestToken: readEnvValue(source, "UPSTASH_REDIS_REST_TOKEN"),
    railwayEnvironment: readEnvValue(source, "RAILWAY_ENVIRONMENT"),
    port: Number(readEnvValue(source, "PORT") ?? "3001"),
  };
}
