import { generateObject } from "ai";
import type { EnvSource } from "@newsflow/config";
import { MAX_ARTICLES_PER_FETCH } from "@newsflow/config";
import {
  NewsSearchResponseSchema,
  type ArticleCandidate,
  type TopicConfig,
} from "@newsflow/db";
import { resolveWorkerRuntimeEnv } from "../lib/env";
import { createWorkerPerplexityProvider } from "./models";
import { buildNewsSearchPrompt } from "./prompts";

export async function runWorkerNewsSearch(
  input: {
    topicName: string;
    topicConfig: TopicConfig;
    maxArticles?: number;
  },
  source?: EnvSource
): Promise<ArticleCandidate[]> {
  const provider = createWorkerPerplexityProvider(source);
  const { newsSearchModel } = resolveWorkerRuntimeEnv(source);

  const result = await generateObject({
    model: provider(newsSearchModel) as any,
    schema: NewsSearchResponseSchema,
    prompt: buildNewsSearchPrompt({
      topicName: input.topicName,
      topicConfig: input.topicConfig,
      maxArticles: input.maxArticles ?? MAX_ARTICLES_PER_FETCH,
    }),
  });

  return result.object.articles;
}
