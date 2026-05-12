import { createOpenAI } from "@ai-sdk/openai";
import {
  type EnvSource,
  resolveOpenAIEnv,
} from "@newsflow/config";

export function createOpenAIProvider(source?: EnvSource) {
  const { openaiApiKey } = resolveOpenAIEnv(source);
  return createOpenAI({
    apiKey: openaiApiKey,
    compatibility: "strict",
  });
}


