import { getEnvValue, type EnvSource } from "@newsflow/config";

export type WorkerEnvironment = "development" | "production" | "test";

export interface WorkerRuntimeEnv {
  workerEnvironment: WorkerEnvironment;
  workerTestModeEnabled: boolean;
  workerQueueRequested: boolean;
  workerSchedulerRequested: boolean;
  workerAllowDevQueue: boolean;
  workerAllowDevScheduler: boolean;
  workerPollCron: string;
  workerSchedulerEnabled: boolean;
  workerQueueEnabled: boolean;
  workerAudioQueueEnabled: boolean;
  workerManualTriggerMode: "queue" | "inline";
  workerJobAttempts: number;
  workerMaxArticlesPerFetch: number;
  workerMaxArticlesPerFetchCap: number;
  workerSchedulerMaxDueTopics: number;
  workerPipelineConcurrency: number;
  workerAudioConcurrency: number;
  workerQueueRateLimitMax: number;
  workerQueueRateLimitDurationMs: number;
  workerQueueDrainDelaySeconds: number;
  workerQueueStalledIntervalMs: number;
  workerQueuePrefix?: string;
  workerManualTriggerMinIntervalMs: number;
  workerRequestBodyLimitBytes: number;
  workerExternalCallsEnabled: boolean;
  workerUnsplashEnabled: boolean;
  workerMemoryIndexingEnabled: boolean;
  workerDigestEmailEnabled: boolean;
  workerMdxFallbackEnabled: boolean;
  topicDialogueModel: string;
  articleSummaryModel: string;
  articleMdxPipelineEnabled: boolean;
  articleDistillationModel: string;
  articleMdxModel: string;
  articleEmbeddingModel: string;
  unsplashAccessKey?: string;
  serperApiKey?: string;
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

export function readBooleanEnvValue(source: EnvSource, key: string, fallback = false) {
  const value = readEnvValue(source, key)?.toLowerCase();

  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value);
}

export function readNumberEnvValue(source: EnvSource, key: string, fallback: number) {
  const value = Number(readEnvValue(source, key));
  return Number.isFinite(value) ? value : fallback;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function readClampedNumberEnvValue(
  source: EnvSource,
  key: string,
  fallback: number,
  min: number,
  max: number
) {
  return clampNumber(readNumberEnvValue(source, key, fallback), min, max);
}

function normalizeWorkerEnvironment(value?: string): WorkerEnvironment {
  const normalized = value?.toLowerCase();

  if (normalized === "production" || normalized === "prod") {
    return "production";
  }

  if (normalized === "test" || normalized === "testing") {
    return "test";
  }

  return "development";
}

function readWorkerEnvironment(source: EnvSource) {
  return normalizeWorkerEnvironment(
    getEnvValue(
      ["WORKER_ENVIRONMENT", "RAILWAY_ENVIRONMENT_NAME", "RAILWAY_ENVIRONMENT", "NODE_ENV"],
      source
    )
  );
}

function readManualTriggerMode(source: EnvSource, queueEnabled: boolean) {
  const value = readEnvValue(source, "WORKER_MANUAL_TRIGGER_MODE")?.toLowerCase();

  if (value === "queue" && queueEnabled) {
    return "queue";
  }

  if (value === "inline") {
    return "inline";
  }

  return queueEnabled ? "queue" : "inline";
}

function readQueuePrefix(source: EnvSource, workerEnvironment: WorkerEnvironment) {
  const explicitPrefix = readEnvValue(source, "WORKER_QUEUE_PREFIX");

  if (explicitPrefix) {
    return explicitPrefix;
  }

  if (workerEnvironment !== "production") {
    return `newsflow-worker-${workerEnvironment}`;
  }

  return undefined;
}

export function resolveWorkerRuntimeEnv(source: EnvSource = defaultEnvSource()): WorkerRuntimeEnv {
  const workerEnvironment = readWorkerEnvironment(source);
  const workerTestModeEnabled =
    workerEnvironment === "test" || readBooleanEnvValue(source, "WORKER_TEST_MODE");
  const workerAllowDevQueue = readBooleanEnvValue(source, "WORKER_ALLOW_DEV_QUEUE");
  const workerAllowDevScheduler = readBooleanEnvValue(source, "WORKER_ALLOW_DEV_SCHEDULER");
  const workerQueueRequested = readBooleanEnvValue(source, "WORKER_QUEUE_ENABLED");
  const workerQueueAllowed =
    !workerTestModeEnabled &&
    (workerEnvironment === "production" || workerAllowDevQueue);
  const workerQueueEnabled = workerQueueRequested && workerQueueAllowed;
  const workerAudioQueueEnabled =
    workerQueueEnabled && readBooleanEnvValue(source, "WORKER_AUDIO_QUEUE_ENABLED");
  const workerSchedulerRequested = readBooleanEnvValue(source, "WORKER_SCHEDULER_ENABLED");
  const workerSchedulerAllowed =
    !workerTestModeEnabled &&
    workerQueueEnabled &&
    (workerEnvironment === "production" || workerAllowDevScheduler);
  const workerSchedulerEnabled = workerSchedulerRequested && workerSchedulerAllowed;
  const workerMaxArticlesPerFetchCap = readClampedNumberEnvValue(
    source,
    "WORKER_MAX_ARTICLES_PER_FETCH_CAP",
    workerEnvironment === "production" ? 5 : 1,
    1,
    25
  );
  const workerMaxArticlesPerFetch = Math.min(
    readClampedNumberEnvValue(source, "WORKER_MAX_ARTICLES_PER_FETCH", 1, 1, 25),
    workerMaxArticlesPerFetchCap
  );

  return {
    workerEnvironment,
    workerTestModeEnabled,
    workerQueueRequested,
    workerSchedulerRequested,
    workerAllowDevQueue,
    workerAllowDevScheduler,
    workerPollCron: readEnvValue(source, "WORKER_POLL_CRON") ?? "*/15 * * * *",
    workerSchedulerEnabled,
    workerQueueEnabled,
    workerAudioQueueEnabled,
    workerManualTriggerMode: readManualTriggerMode(source, workerQueueEnabled),
    workerJobAttempts: Math.max(1, readNumberEnvValue(source, "WORKER_JOB_ATTEMPTS", 1)),
    workerMaxArticlesPerFetch,
    workerMaxArticlesPerFetchCap,
    workerSchedulerMaxDueTopics: readClampedNumberEnvValue(
      source,
      "WORKER_SCHEDULER_MAX_DUE_TOPICS",
      workerEnvironment === "production" ? 25 : 5,
      1,
      1_000
    ),
    workerPipelineConcurrency: readClampedNumberEnvValue(
      source,
      "WORKER_PIPELINE_CONCURRENCY",
      1,
      1,
      25
    ),
    workerAudioConcurrency: readClampedNumberEnvValue(
      source,
      "WORKER_AUDIO_CONCURRENCY",
      1,
      1,
      10
    ),
    workerQueueRateLimitMax: readClampedNumberEnvValue(
      source,
      "WORKER_QUEUE_RATE_LIMIT_MAX",
      workerEnvironment === "production" ? 10 : 2,
      1,
      1_000
    ),
    workerQueueRateLimitDurationMs: readClampedNumberEnvValue(
      source,
      "WORKER_QUEUE_RATE_LIMIT_DURATION_MS",
      60_000,
      1_000,
      60 * 60 * 1000
    ),
    workerQueueDrainDelaySeconds: readClampedNumberEnvValue(
      source,
      "WORKER_QUEUE_DRAIN_DELAY_SECONDS",
      60,
      5,
      300
    ),
    workerQueueStalledIntervalMs: readClampedNumberEnvValue(
      source,
      "WORKER_QUEUE_STALLED_INTERVAL_MS",
      5 * 60 * 1000,
      30_000,
      60 * 60 * 1000
    ),
    workerQueuePrefix: readQueuePrefix(source, workerEnvironment),
    workerManualTriggerMinIntervalMs: readClampedNumberEnvValue(
      source,
      "WORKER_MANUAL_TRIGGER_MIN_INTERVAL_MS",
      60_000,
      0,
      24 * 60 * 60 * 1000
    ),
    workerRequestBodyLimitBytes: readClampedNumberEnvValue(
      source,
      "WORKER_REQUEST_BODY_LIMIT_BYTES",
      16 * 1024,
      1024,
      1024 * 1024
    ),
    workerExternalCallsEnabled: workerTestModeEnabled
      ? false
      : readBooleanEnvValue(source, "WORKER_EXTERNAL_CALLS_ENABLED", true),
    workerUnsplashEnabled: workerTestModeEnabled
      ? false
      : readBooleanEnvValue(source, "WORKER_UNSPLASH_ENABLED", true),
    workerMemoryIndexingEnabled: workerTestModeEnabled
      ? false
      : readBooleanEnvValue(
          source,
          "WORKER_MEMORY_INDEXING_ENABLED",
          workerEnvironment === "production"
        ),
    workerDigestEmailEnabled: readBooleanEnvValue(source, "WORKER_DIGEST_EMAIL_ENABLED"),
    workerMdxFallbackEnabled: readBooleanEnvValue(source, "WORKER_MDX_FALLBACK_ENABLED"),
    topicDialogueModel: readEnvValue(source, "TOPIC_DIALOGUE_MODEL") ?? "gpt-4o",
    articleSummaryModel: readEnvValue(source, "ARTICLE_SUMMARY_MODEL") ?? "gpt-4o-mini",
    articleMdxPipelineEnabled: readBooleanEnvValue(source, "ENABLE_ARTICLE_MDX_PIPELINE"),
    articleDistillationModel: readEnvValue(source, "ARTICLE_DISTILLATION_MODEL") ?? "gpt-4o-mini",
    articleMdxModel: readEnvValue(source, "ARTICLE_MDX_MODEL") ?? "gpt-4o",
    articleEmbeddingModel: readEnvValue(source, "ARTICLE_EMBEDDING_MODEL") ?? "text-embedding-3-small",
    unsplashAccessKey: readEnvValue(source, "UNSPLASH_ACCESS_KEY"),
    serperApiKey: readEnvValue(source, "SERPER_API_KEY"),
    workerAuthToken: readEnvValue(source, "WORKER_AUTH_TOKEN"),
    upstashRestUrl: readEnvValue(source, "UPSTASH_REDIS_REST_URL"),
    upstashRestToken: readEnvValue(source, "UPSTASH_REDIS_REST_TOKEN"),
    railwayEnvironment: readEnvValue(source, "RAILWAY_ENVIRONMENT"),
    port: Number(readEnvValue(source, "PORT") ?? "3001"),
  };
}
