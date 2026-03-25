import { generateObject } from "ai";
import type { EnvSource } from "@newsflow/config";
import {
  TopicRefinementSchema,
  type TopicRefinementResult,
} from "@newsflow/db";
import { resolveWorkerRuntimeEnv } from "../lib/env";
import { createWorkerOpenAIProvider } from "./models";
import { buildTopicDialoguePrompt } from "./prompts";

export interface TopicDialogueMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TopicDialogueInput {
  category: string;
  topicPrompt: string;
  priorMessages?: TopicDialogueMessage[];
}

export async function runWorkerTopicDialogue(input: TopicDialogueInput, source?: EnvSource): Promise<TopicRefinementResult> {
  const provider = createWorkerOpenAIProvider(source);
  const { topicDialogueModel } = resolveWorkerRuntimeEnv(source);

  const result = await generateObject({
    model: provider(topicDialogueModel) as any,
    schema: TopicRefinementSchema,
    prompt: buildTopicDialoguePrompt(input),
  });

  return result.object;
}
