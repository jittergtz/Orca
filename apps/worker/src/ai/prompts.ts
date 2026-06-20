import {
  ARTICLE_MAX_WORDS,
  TLDR_MAX_BULLETS,
} from "@newsflow/config";
import type { ArticleDistillation, TopicConfig } from "@newsflow/db";
import type { TopicDialogueInput } from "./topicAgent";

export function buildTopicDialoguePrompt(input: TopicDialogueInput) {
  const history = (input.priorMessages ?? [])
    .map(message => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  return [
    "You are Orca, an onboarding agent for a personalized news product.",
    "Ask only what is needed to sharpen the topic scope, then finalize a structured config.",
    "Output a concise topic label, normalized category, signal list, exclusion list, and a strong searchQuery.",
    "The searchQuery must be production-ready for financial/news sources and avoid filler wording.",
    `Category: ${input.category}`,
    `Initial prompt: ${input.topicPrompt}`,
    history ? `Conversation history:\n${history}` : "Conversation history:\nNone",
  ].join("\n\n");
}

/**
 * Build an optimized Google News search query from a topic config.
 *
 * For hyper-specific topics (e.g. "Intel Fab 52 ASML"), this produces a
 * tight Boolean query that Serper sends directly to Google News.
 *
 * For general topics (e.g. "AI research news"), it produces a broader query
 * and relies on the downstream summarizer to deduplicate/cluster.
 */
export function buildSerperQuery(input: {
  topicName: string;
  topicConfig: TopicConfig;
}): string {
  const parts: string[] = [];

  // Start with the core search query from the topic config
  if (input.topicConfig.searchQuery) {
    parts.push(input.topicConfig.searchQuery);
  } else {
    parts.push(input.topicName);
  }

  // Add signal keywords if they exist
  if (input.topicConfig.signals.length > 0) {
    const signalTerms = input.topicConfig.signals.join(" OR ");
    parts.push(`(${signalTerms})`);
  }

  // Add exclusions with minus operator
  for (const exclude of input.topicConfig.exclude) {
    parts.push(`-"${exclude}"`);
  }

  return parts.join(" ");
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

export function buildArticleDistillationPrompt(input: {
  topicName: string;
  sourceTitle: string;
  sourceUrl: string;
  rawText: string;
}) {
  return [
    "Extract a structured factual payload from this scraped news article.",
    "Remove boilerplate, ads, navigation, author bios, unrelated recommendations, and duplicate text.",
    "Keep only facts supported by the supplied article text.",
    "Prefer concrete figures, dates, entities, quotes, timeline events, and causally important details.",
    "If a quote has no clear speaker, set speaker to null.",
    "Return sourceUrls with only URLs present in this prompt.",
    "",
    `Topic: ${input.topicName}`,
    `Article title: ${input.sourceTitle}`,
    `Article URL: ${input.sourceUrl}`,
    "",
    input.rawText,
  ].join("\n");
}

export function buildArticleMdxPrompt(input: {
  topicName: string;
  sourceTitle: string;
  sourceUrl: string;
  rollingSummary?: string | null;
  distillation: ArticleDistillation;
}) {
  const memory = input.rollingSummary
    ? [
        "The user has already read prior coverage summarized below.",
        "Focus on net-new developments and avoid re-explaining foundations unless needed.",
        input.rollingSummary,
      ].join("\n")
    : "No prior rolling memory is available for this topic.";

  return [
    "Write a concise, rich MDX article for Orca's desktop news reader.",
    "Use only the supplied structured payload. Do not invent facts.",
    "Output raw markdown paragraphs and headings outside custom components.",
    "Allowed custom components are strictly:",
    '- <DataTable title="..." headers={["Column"]} rows={[["Value"]]} />',
    '- <MetricCard label="..." value="..." change="..." />',
    '- <DataChart title="..." type="bar" data={[{"label":"Q1","value":10}]} xKey="label" yKey="value" />',
    "Do not output imports, exports, HTML, scripts, iframes, style tags, event handlers, or unknown components.",
    "Use components only when they make the article easier to scan.",
    "Choose an imageSearchQuery that would find a tasteful editorial landscape image for the article.",
    "",
    `Topic: ${input.topicName}`,
    `Source title: ${input.sourceTitle}`,
    `Source URL: ${input.sourceUrl}`,
    "",
    "Rolling memory:",
    memory,
    "",
    "Structured payload:",
    JSON.stringify(input.distillation, null, 2),
  ].join("\n");
}
