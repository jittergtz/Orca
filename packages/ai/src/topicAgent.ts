import { generateObject } from "ai";
import type { EnvSource } from "@newsflow/config";
import {
  TopicRefinementSchema,
  type TopicRefinementResult,
} from "@newsflow/db";
import { createOpenAIProvider } from "./models";

export interface TopicDialogueMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TopicDialogueInput {
  category: string;
  topicPrompt: string;
  priorMessages?: TopicDialogueMessage[];
}

export function buildTopicDialoguePrompt(input: TopicDialogueInput) {
  const history = (input.priorMessages ?? [])
    .map(message => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  return [
    "You are NewsFlow, an onboarding agent for a personalized news product.",
    "Convert the user topic into a structured config for downstream search.",
    "Return concrete signal keywords and a searchQuery optimized for reliable news sources.",
    "Keep the result tightly scoped to the user intent and remove filler.",
    `Category: ${input.category}`,
    `Initial prompt: ${input.topicPrompt}`,
    history ? `Conversation history:\n${history}` : "Conversation history:\nNone",
  ].join("\n\n");
}

export async function runTopicDialogue(input: TopicDialogueInput, source?: EnvSource): Promise<TopicRefinementResult> {
  const provider = createOpenAIProvider(source);
  const result = await generateObject({
    model: provider("gpt-4o-mini") as any,
    schema: TopicRefinementSchema,
    prompt: buildTopicDialoguePrompt(input),
  });

  return result.object;
}
