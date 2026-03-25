import { generateObject } from "ai";
import type { EnvSource } from "@newsflow/config";
import {
  ArticleSummarySchema,
  type ArticleSummary,
} from "@newsflow/db";
import { resolveWorkerRuntimeEnv } from "../lib/env";
import { createWorkerOpenAIProvider } from "./models";
import { buildSummaryPrompt } from "./prompts";

export async function runWorkerArticleSummary(rawText: string, source?: EnvSource): Promise<ArticleSummary> {
  const provider = createWorkerOpenAIProvider(source);
  const { articleSummaryModel } = resolveWorkerRuntimeEnv(source);

  const result = await generateObject({
    model: provider(articleSummaryModel) as any,
    schema: ArticleSummarySchema,
    prompt: buildSummaryPrompt(rawText),
  });

  return result.object;
}
