import { createHash } from "crypto";
import IORedis from "ioredis";
import {
  Queue,
  Worker,
  type JobsOptions,
  type WorkerOptions,
} from "bullmq";
import {
  type EnvSource,
  resolveRedisEnv,
} from "@newsflow/config";
import { fetchNewsJob } from "./jobs/fetchNews";
import { summarizeJob } from "./jobs/summarize";
import { generateAudioJob } from "./jobs/audio";
import { resolveWorkerRuntimeEnv } from "./lib/env";

export const PIPELINE_QUEUE = "newsflow-pipeline";
export const AUDIO_QUEUE = "newsflow-audio";

export const JOB_NAMES = {
  fetchNews: "fetch-news",
  summarizeArticle: "summarize-article",
  generateAudio: "generate-audio",
} as const;

export interface FetchNewsJobData {
  topicId: string;
  initiatedBy: "manual" | "schedule";
}

export interface SummarizeArticleJobData {
  topicId: string;
  topicName: string;
  sourceUrl: string;
  sourceName: string;
  title: string;
  publishedAt: string;
  rawText: string;
}

export interface GenerateAudioJobData {
  articleId: string;
}

type QueueConnection = IORedis;

function defaultEnvSource(): EnvSource {
  return (((globalThis as { process?: { env?: EnvSource } }).process?.env ?? {}) as EnvSource);
}

function defaultJobOptions(source: EnvSource = defaultEnvSource()): JobsOptions {
  const { workerJobAttempts } = resolveWorkerRuntimeEnv(source);

  return {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: workerJobAttempts,
    backoff: {
      type: "exponential",
      delay: 3_000,
    },
  };
}

function hashJobPart(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

export function fetchNewsJobOptions(data: FetchNewsJobData): JobsOptions {
  return {
    jobId: `fetch-${data.initiatedBy}-${data.topicId}`,
    removeOnComplete: true,
    removeOnFail: true,
  };
}

export function summarizeArticleJobOptions(data: SummarizeArticleJobData): JobsOptions {
  return {
    jobId: `summarize-${data.topicId}-${hashJobPart(data.sourceUrl)}`,
  };
}

export function generateAudioJobOptions(data: GenerateAudioJobData): JobsOptions {
  return {
    jobId: `audio-${data.articleId}`,
  };
}

function queueBaseOptions(connection: QueueConnection, source: EnvSource = defaultEnvSource()) {
  const { workerQueuePrefix } = resolveWorkerRuntimeEnv(source);

  return {
    connection,
    ...(workerQueuePrefix ? { prefix: workerQueuePrefix } : {}),
  };
}

function defaultWorkerOptions(
  connection: QueueConnection,
  source: EnvSource = defaultEnvSource(),
  concurrency = resolveWorkerRuntimeEnv(source).workerPipelineConcurrency
): WorkerOptions {
  const {
    workerJobAttempts,
    workerQueueDrainDelaySeconds,
    workerQueueRateLimitDurationMs,
    workerQueueRateLimitMax,
    workerQueueStalledIntervalMs,
  } = resolveWorkerRuntimeEnv(source);

  return {
    ...queueBaseOptions(connection, source),
    concurrency,
    drainDelay: workerQueueDrainDelaySeconds,
    maxStartedAttempts: workerJobAttempts,
    stalledInterval: workerQueueStalledIntervalMs,
    limiter: {
      max: workerQueueRateLimitMax,
      duration: workerQueueRateLimitDurationMs,
    },
  };
}

export function createRedisConnection(source: EnvSource = defaultEnvSource()) {
  const { redisUrl } = resolveRedisEnv(source);

  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

export function createPipelineQueue(
  connection = createRedisConnection(),
  source: EnvSource = defaultEnvSource()
) {
  return new Queue<FetchNewsJobData | SummarizeArticleJobData>(PIPELINE_QUEUE, {
    ...queueBaseOptions(connection, source),
    defaultJobOptions: defaultJobOptions(source),
    streams: {
      events: {
        maxLen: 1_000,
      },
    },
  });
}

export function createAudioQueue(
  connection = createRedisConnection(),
  source: EnvSource = defaultEnvSource()
) {
  return new Queue<GenerateAudioJobData>(AUDIO_QUEUE, {
    ...queueBaseOptions(connection, source),
    defaultJobOptions: defaultJobOptions(source),
    streams: {
      events: {
        maxLen: 1_000,
      },
    },
  });
}

export async function enqueueFetchNews(data: FetchNewsJobData, source?: EnvSource) {
  const connection = createRedisConnection(source);
  const queue = createPipelineQueue(connection, source);

  try {
    return await queue.add(JOB_NAMES.fetchNews, data, fetchNewsJobOptions(data));
  } finally {
    await queue.close();
    await connection.quit();
  }
}

export async function enqueueSummarizeArticle(data: SummarizeArticleJobData, source?: EnvSource) {
  const connection = createRedisConnection(source);
  const queue = createPipelineQueue(connection, source);

  try {
    return await queue.add(
      JOB_NAMES.summarizeArticle,
      data,
      summarizeArticleJobOptions(data)
    );
  } finally {
    await queue.close();
    await connection.quit();
  }
}

export async function enqueueSummarizeArticles(data: SummarizeArticleJobData[], source?: EnvSource) {
  if (data.length === 0) {
    return [];
  }

  const connection = createRedisConnection(source);
  const queue = createPipelineQueue(connection, source);

  try {
    return await queue.addBulk(
      data.map(summarizeJob => ({
        name: JOB_NAMES.summarizeArticle,
        data: summarizeJob,
        opts: summarizeArticleJobOptions(summarizeJob),
      }))
    );
  } finally {
    await queue.close();
    await connection.quit();
  }
}

export async function enqueueGenerateAudio(data: GenerateAudioJobData, source?: EnvSource) {
  const connection = createRedisConnection(source);
  const queue = createAudioQueue(connection, source);

  try {
    return await queue.add(JOB_NAMES.generateAudio, data, generateAudioJobOptions(data));
  } finally {
    await queue.close();
    await connection.quit();
  }
}

export async function clearQueues(source?: EnvSource) {
  const connection = createRedisConnection(source);
  const pipelineQueue = createPipelineQueue(connection, source);
  const audioQueue = createAudioQueue(connection, source);

  try {
    await Promise.all([
      pipelineQueue.obliterate({ force: true }),
      audioQueue.obliterate({ force: true }),
    ]);
  } finally {
    await Promise.all([
      pipelineQueue.close(),
      audioQueue.close(),
    ]);
    await connection.quit();
  }
}

export interface WorkerRuntime {
  connection: QueueConnection;
  pipelineWorker: Worker;
  audioWorker: Worker | null;
}

export function createWorkers(source?: EnvSource): WorkerRuntime {
  const {
    workerAudioConcurrency,
    workerAudioQueueEnabled,
    workerPipelineConcurrency,
  } = resolveWorkerRuntimeEnv(source);
  const connection = createRedisConnection(source);

  const pipelineWorker = new Worker(
    PIPELINE_QUEUE,
    async job => {
      if (job.name === JOB_NAMES.fetchNews) {
        return fetchNewsJob(job.data as FetchNewsJobData, source);
      }

      return summarizeJob(job.data as SummarizeArticleJobData, source);
    },
    defaultWorkerOptions(connection, source, workerPipelineConcurrency)
  );

  const audioWorker = workerAudioQueueEnabled
    ? new Worker(
        AUDIO_QUEUE,
        job => generateAudioJob(job.data as GenerateAudioJobData),
        defaultWorkerOptions(connection, source, workerAudioConcurrency)
      )
    : null;

  return {
    connection,
    pipelineWorker,
    audioWorker,
  };
}

export async function closeWorkerRuntime(runtime: WorkerRuntime) {
  await Promise.all([
    runtime.pipelineWorker.close(),
    runtime.audioWorker?.close(),
  ]);
  await runtime.connection.quit();
}
