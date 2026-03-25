import { createOpenAI } from "@ai-sdk/openai";
import {
  type EnvSource,
  resolveOpenAIEnv,
  resolvePerplexityEnv,
} from "@newsflow/config";

export function createWorkerOpenAIProvider(source?: EnvSource) {
  const { openaiApiKey } = resolveOpenAIEnv(source);

  return createOpenAI({
    apiKey: openaiApiKey,
    compatibility: "strict",
  });
}

export function createWorkerPerplexityProvider(source?: EnvSource) {
  const { perplexityApiKey } = resolvePerplexityEnv(source);

  return createOpenAI({
    apiKey: perplexityApiKey,
    baseURL: "https://api.perplexity.ai",
    compatibility: "compatible",
  });
}
