import { generateObject } from "ai";
import type { EnvSource } from "@newsflow/config";
import { MAX_ARTICLES_PER_FETCH } from "@newsflow/config";
import {
  NewsSearchResponseSchema,
  type ArticleCandidate,
  type TopicConfig,
} from "@newsflow/db";
import { createPerplexityProvider } from "./models";

export interface SearchNewsInput {
  topicName: string;
  topicConfig: TopicConfig;
  maxArticles?: number;
}

export function buildNewsSearchPrompt(input: SearchNewsInput) {
  const signals = input.topicConfig.signals.join(", ") || "general developments";
  const exclusions = input.topicConfig.exclude.join(", ") || "none";

  return [
    "Search for current, high-signal news articles that match the user topic.",
    "Prioritize reputable business and news outlets and avoid duplicates.",
    "Return the original source URL, source name, title, publication timestamp, and enough article content for summarization.",
    `Topic: ${input.topicName}`,
    `Search query seed: ${input.topicConfig.searchQuery}`,
    `Signals to include: ${signals}`,
    `Signals to exclude: ${exclusions}`,
    `Return up to ${input.maxArticles ?? MAX_ARTICLES_PER_FETCH} articles.`,
  ].join("\n\n");
}

export async function searchNews(input: SearchNewsInput, source?: EnvSource): Promise<ArticleCandidate[]> {
  const provider = createPerplexityProvider(source);
  const result = await generateObject({
    model: provider("sonar-pro") as any,
    schema: NewsSearchResponseSchema,
    prompt: buildNewsSearchPrompt(input),
  });

  return result.object.articles;
}
