import { embedMany } from "ai";
import type { EnvSource } from "@newsflow/config";
import {
  upsertArticleChunks,
  upsertTopicSummary,
  type ArticleDistillation,
  type ArticleMdxOutput,
  type TopicSummary,
} from "@newsflow/db";
import { createWorkerOpenAIProvider } from "../ai/models";
import { resolveWorkerRuntimeEnv } from "../lib/env";
import { logger } from "../lib/logger";

const TARGET_EMBEDDING_DIMENSIONS = 1536;
const CHUNK_TARGET_WORDS = 500;
const MAX_ROLLING_SUMMARY_CHARS = 3_500;

type DbClient = Parameters<typeof upsertArticleChunks>[0];

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function chunkByWords(content: string, targetWords = CHUNK_TARGET_WORDS) {
  const words = compactWhitespace(content).split(" ").filter(Boolean);
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += targetWords) {
    const chunk = words.slice(index, index + targetWords).join(" ").trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

function buildArticleMemoryEntry(input: {
  mdx: ArticleMdxOutput;
  distillation: ArticleDistillation;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
}) {
  const facts = input.distillation.keyFacts
    .slice(0, 5)
    .map((fact) => fact.text)
    .join(" ");
  const entities = input.distillation.entities.slice(0, 8).join(", ");
  const tldr = input.mdx.tldr.join(" ");

  return compactWhitespace(
    [
      `${input.publishedAt}: ${input.mdx.title} (${input.sourceName}).`,
      tldr,
      facts ? `Key facts: ${facts}` : "",
      entities ? `Entities: ${entities}.` : "",
      `Source: ${input.sourceUrl}`,
    ].filter(Boolean).join(" ")
  );
}

function buildRollingSummary(input: {
  previousSummary?: TopicSummary | null;
  articleEntry: string;
}) {
  const existing = input.previousSummary?.rolling_summary?.trim();
  const combined = existing
    ? `${existing}\n\n${input.articleEntry}`
    : input.articleEntry;

  if (combined.length <= MAX_ROLLING_SUMMARY_CHARS) {
    return combined;
  }

  return combined.slice(combined.length - MAX_ROLLING_SUMMARY_CHARS).replace(/^\S+\s*/, "").trim();
}

async function embedChunks(chunks: string[], source?: EnvSource) {
  if (chunks.length === 0) {
    return [];
  }

  const provider = createWorkerOpenAIProvider(source);
  const { articleEmbeddingModel } = resolveWorkerRuntimeEnv(source);
  const result = await embedMany({
    model: provider.embedding(articleEmbeddingModel, {
      dimensions: TARGET_EMBEDDING_DIMENSIONS,
    }),
    values: chunks,
  });

  return result.embeddings.map((embedding, index) => {
    if (embedding.length !== TARGET_EMBEDDING_DIMENSIONS) {
      logger.warn("Article embedding dimension mismatch", {
        expected: TARGET_EMBEDDING_DIMENSIONS,
        actual: embedding.length,
        chunkIndex: index,
      });
      return null;
    }

    return embedding;
  });
}

export async function indexArticleMemory(
  client: DbClient,
  input: {
    articleId: string;
    userId: string;
    topicQuery: string;
    sourceName: string;
    sourceUrl: string;
    publishedAt: string;
    mdx: ArticleMdxOutput;
    distillation: ArticleDistillation;
    previousTopicSummary?: TopicSummary | null;
  },
  source?: EnvSource
) {
  const plainText = compactWhitespace(
    [
      input.mdx.title,
      input.mdx.tldr.join(" "),
      input.mdx.contentMdx,
    ].join("\n\n")
  );
  const chunks = chunkByWords(plainText);
  const embeddings = await embedChunks(chunks, source);
  const savedChunks = await upsertArticleChunks(
    client,
    chunks.map((content, index) => ({
      article_id: input.articleId,
      user_id: input.userId,
      chunk_index: index,
      content,
      embedding: embeddings[index],
    }))
  );
  const articleEntry = buildArticleMemoryEntry({
    mdx: input.mdx,
    distillation: input.distillation,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    publishedAt: input.publishedAt,
  });
  const nextSummary = buildRollingSummary({
    previousSummary: input.previousTopicSummary,
    articleEntry,
  });
  const topicSummary = await upsertTopicSummary(client, {
    user_id: input.userId,
    topic_query: input.topicQuery,
    rolling_summary: nextSummary,
  });

  return {
    chunkCount: savedChunks.length,
    embeddedChunkCount: embeddings.filter(Boolean).length,
    topicSummaryId: topicSummary.id,
  };
}
