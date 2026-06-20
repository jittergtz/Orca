import { generateObject } from "ai";
import type { EnvSource } from "@newsflow/config";
import {
  ArticleDistillationSchema,
  ArticleMdxOutputSchema,
  type ArticleDistillation,
  type ArticleMdxOutput,
} from "@newsflow/db";
import { resolveWorkerRuntimeEnv } from "../lib/env";
import { createWorkerOpenAIProvider } from "./models";
import {
  buildArticleDistillationPrompt,
  buildArticleMdxPrompt,
} from "./prompts";

const ALLOWED_COMPONENTS = new Set(["DataTable", "MetricCard", "DataChart"]);
const DISALLOWED_MDX_PATTERNS = [
  /\bimport\s+/i,
  /\bexport\s+/i,
  /<script\b/i,
  /<style\b/i,
  /<iframe\b/i,
  /\son[A-Z][A-Za-z]*=/,
  /\son[a-z][A-Za-z]*=/,
];

export async function runWorkerArticleDistillation(
  input: {
    topicName: string;
    sourceTitle: string;
    sourceUrl: string;
    rawText: string;
  },
  source?: EnvSource
): Promise<ArticleDistillation> {
  const provider = createWorkerOpenAIProvider(source);
  const { articleDistillationModel } = resolveWorkerRuntimeEnv(source);

  const result = await generateObject({
    model: provider(articleDistillationModel) as any,
    schema: ArticleDistillationSchema,
    prompt: buildArticleDistillationPrompt(input),
  });

  return result.object;
}

export async function runWorkerArticleMdxGeneration(
  input: {
    topicName: string;
    sourceTitle: string;
    sourceUrl: string;
    rollingSummary?: string | null;
    distillation: ArticleDistillation;
  },
  source?: EnvSource
): Promise<ArticleMdxOutput> {
  const provider = createWorkerOpenAIProvider(source);
  const { articleMdxModel } = resolveWorkerRuntimeEnv(source);

  const result = await generateObject({
    model: provider(articleMdxModel) as any,
    schema: ArticleMdxOutputSchema,
    prompt: buildArticleMdxPrompt(input),
  });

  assertSafeArticleMdx(result.object.contentMdx);

  return result.object;
}

export function assertSafeArticleMdx(content: string) {
  for (const pattern of DISALLOWED_MDX_PATTERNS) {
    if (pattern.test(content)) {
      throw new Error("Generated MDX contains disallowed syntax");
    }
  }

  const componentPattern = /<([A-Z][A-Za-z0-9]*)\b/g;
  const unknownComponents = new Set<string>();
  let match = componentPattern.exec(content);

  while (match) {
    const componentName = match[1];

    if (!ALLOWED_COMPONENTS.has(componentName)) {
      unknownComponents.add(componentName);
    }

    match = componentPattern.exec(content);
  }

  if (unknownComponents.size > 0) {
    throw new Error(
      `Generated MDX contains unknown components: ${Array.from(unknownComponents).join(", ")}`
    );
  }
}
