import IORedis from "ioredis";
import {
  Queue,
  Worker,
  type JobsOptions,
} from "bullmq";
import {
  type EnvSource,
  resolveRedisEnv,
} from "@newsflow/config";
import { fetchNewsJob } from "./jobs/fetchNews";
import { summarizeJob } from "./jobs/summarize";
import { generateAudioJob } from "./jobs/audio";

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

function defaultJobOptions(): JobsOptions {
  return {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3_000,
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

export function createPipelineQueue(connection = createRedisConnection()) {
  return new Queue<FetchNewsJobData | SummarizeArticleJobData>(PIPELINE_QUEUE, {
    connection,
    defaultJobOptions: defaultJobOptions(),
  });
}

export function createAudioQueue(connection = createRedisConnection()) {
  return new Queue<GenerateAudioJobData>(AUDIO_QUEUE, {
    connection,
    defaultJobOptions: defaultJobOptions(),
  });
}

export async function enqueueFetchNews(data: FetchNewsJobData, source?: EnvSource) {
  const connection = createRedisConnection(source);
  const queue = createPipelineQueue(connection);

  try {
    return await queue.add(JOB_NAMES.fetchNews, data);
  } finally {
    await queue.close();
    await connection.quit();
  }
}

export async function enqueueSummarizeArticle(data: SummarizeArticleJobData, source?: EnvSource) {
  const connection = createRedisConnection(source);
  const queue = createPipelineQueue(connection);

  try {
    return await queue.add(JOB_NAMES.summarizeArticle, data);
  } finally {
    await queue.close();
    await connection.quit();
  }
}

export async function enqueueGenerateAudio(data: GenerateAudioJobData, source?: EnvSource) {
  const connection = createRedisConnection(source);
  const queue = createAudioQueue(connection);

  try {
    return await queue.add(JOB_NAMES.generateAudio, data);
  } finally {
    await queue.close();
    await connection.quit();
  }
}

export interface WorkerRuntime {
  connection: QueueConnection;
  pipelineWorker: Worker;
  audioWorker: Worker;
}

export function createWorkers(source?: EnvSource): WorkerRuntime {
  const connection = createRedisConnection(source);

  const pipelineWorker = new Worker(
    PIPELINE_QUEUE,
    async job => {
      if (job.name === JOB_NAMES.fetchNews) {
        return fetchNewsJob(job.data as FetchNewsJobData, source);
      }

      return summarizeJob(job.data as SummarizeArticleJobData, source);
    },
    { connection }
  );

  const audioWorker = new Worker(
    AUDIO_QUEUE,
    job => generateAudioJob(job.data as GenerateAudioJobData),
    { connection }
  );

  return {
    connection,
    pipelineWorker,
    audioWorker,
  };
}

export async function closeWorkerRuntime(runtime: WorkerRuntime) {
  await Promise.all([
    runtime.pipelineWorker.close(),
    runtime.audioWorker.close(),
  ]);
  await runtime.connection.quit();
}
