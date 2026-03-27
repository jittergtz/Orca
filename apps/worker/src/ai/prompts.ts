import {
  ARTICLE_MAX_WORDS,
  TLDR_MAX_BULLETS,
} from "@newsflow/config";
import type { TopicConfig } from "@newsflow/db";
import type { TopicDialogueInput } from "./topicAgent";

export function buildTopicDialoguePrompt(input: TopicDialogueInput) {
  const history = (input.priorMessages ?? [])
    .map(message => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  return [
    "You are NewsFlow, an onboarding agent for a personalized news product.",
    "Ask only what is needed to sharpen the topic scope, then finalize a structured config.",
    "Output a concise topic label, normalized category, signal list, exclusion list, and a strong searchQuery.",
    "The searchQuery must be production-ready for financial/news sources and avoid filler wording.",
    `Category: ${input.category}`,
    `Initial prompt: ${input.topicPrompt}`,
    history ? `Conversation history:\n${history}` : "Conversation history:\nNone",
  ].join("\n\n");
}

export function buildNewsSearchPrompt(input: {
  topicName: string;
  topicConfig: TopicConfig;
  maxArticles: number;
}) {
  return [
    "Search for current, high-signal news articles that match the user topic.",
    "Prioritize reputable, factual sources and avoid near-duplicate entries.",
    "Return enough article content for downstream summarization.",
    `Topic: ${input.topicName}`,
    `Search query seed: ${input.topicConfig.searchQuery}`,
    `Signals to include: ${input.topicConfig.signals.join(", ") || "general developments"}`,
    `Signals to exclude: ${input.topicConfig.exclude.join(", ") || "none"}`,
    `Return up to ${input.maxArticles} articles.`,
  ].join("\n\n");
}

export function buildSummaryPrompt(rawText: string) {
  return [
    "Summarize the provided news article for a distraction-free desktop briefing.",
    "Strip ads, promotional language, author bios, and boilerplate.",
    `Keep the body under ${ARTICLE_MAX_WORDS} words.`,
    `Return between 3 and ${TLDR_MAX_BULLETS} TL;DR bullets.`,
    "Estimate readMinutes from the cleaned body length.",
    "",
    rawText,
  ].join("\n");
}
