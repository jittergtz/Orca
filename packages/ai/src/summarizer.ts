import { generateObject } from "ai";
import type { EnvSource } from "@newsflow/config";
import {
  ARTICLE_MAX_WORDS,
  TLDR_MAX_BULLETS,
} from "@newsflow/config";
import {
  ArticleSummarySchema,
  type ArticleSummary,
} from "@newsflow/db";
import { createOpenAIProvider } from "./models";

export function buildSummarizerPrompt(rawText: string) {
  return [
    "Summarize the provided news article for a distraction-free desktop news brief.",
    "Strip ads, promotional language, author bios, and boilerplate.",
    `Keep the body under ${ARTICLE_MAX_WORDS} words.`,
    `Return between 3 and ${TLDR_MAX_BULLETS} TL;DR bullets.`,
    "Estimate readMinutes based on the cleaned body length.",
    "",
    rawText,
  ].join("\n");
}

export async function summarizeArticle(rawText: string, source?: EnvSource): Promise<ArticleSummary> {
  const provider = createOpenAIProvider(source);
  const result = await generateObject({
    model: provider("gpt-4o-mini") as any,
    schema: ArticleSummarySchema,
    prompt: buildSummarizerPrompt(rawText),
  });

  return result.object;
}
