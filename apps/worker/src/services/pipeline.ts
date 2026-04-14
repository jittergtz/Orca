import { createHash } from "crypto";
import type { EnvSource } from "@newsflow/config";
import {
  createServiceRoleClient,
  getTopicById,
  updateTopicFetchTimestamp,
  upsertArticle,
} from "@newsflow/db";
import { runWorkerArticleSummary, runWorkerNewsSearch } from "../ai";
import { logger } from "../lib/logger";
import {
  enqueueSummarizeArticle,
  type FetchNewsJobData,
  type SummarizeArticleJobData,
} from "../queue";
import { sendTopicDigest } from "./email";

function dedupeBySourceUrl<T extends { sourceUrl: string }>(items: T[]) {
  const seen = new Set<string>();

  return items.filter(item => {
    if (seen.has(item.sourceUrl)) {
      return false;
    }

    seen.add(item.sourceUrl);
    return true;
  });
}

export async function executeFetchPipeline(
  data: FetchNewsJobData,
  source?: EnvSource,
  options?: { dryRun?: boolean }
) {
  const supabase = createServiceRoleClient(source);
  const topic = await getTopicById(supabase, data.topicId);

  if (!topic || !topic.is_active) {
    logger.warn("Fetch pipeline skipped inactive or missing topic", {
      topicId: data.topicId,
    });
    return { topicId: data.topicId, queued: 0, skipped: true };
  }

  const articles = dedupeBySourceUrl(
    await runWorkerNewsSearch(
      {
        topicName: topic.name,
        topicConfig: topic.config,
      },
      source
    )
  );

  if (!options?.dryRun) {
    await Promise.all(
      articles.map(article =>
        enqueueSummarizeArticle(
          {
            topicId: topic.id,
            topicName: topic.name,
            sourceUrl: article.sourceUrl,
            sourceName: article.sourceName,
            title: article.title,
            publishedAt: article.publishedAt,
            rawText: article.content,
          },
          source
        )
      )
    );

    await updateTopicFetchTimestamp(supabase, topic.id);

    // Send digest email for daily/weekly topics
    if (topic.frequency !== 'realtime' && articles.length > 0) {
      await sendTopicDigest(
        topic.id,
        articles.map(a => ({
          title: a.title,
          sourceUrl: a.sourceUrl,
          sourceName: a.sourceName,
        })),
        source
      );
    }
  }

  logger.info("Fetch pipeline completed", {
    topicId: topic.id,
    articleCount: articles.length,
    dryRun: options?.dryRun === true,
  });

  return {
    topicId: topic.id,
    topicName: topic.name,
    queued: options?.dryRun ? 0 : articles.length,
    discovered: articles.length,
    articles: articles.map(article => ({
      sourceUrl: article.sourceUrl,
      sourceName: article.sourceName,
      title: article.title,
      publishedAt: article.publishedAt,
    })),
    initiatedBy: data.initiatedBy,
  };
}

export async function executeSummarizePipeline(data: SummarizeArticleJobData, source?: EnvSource) {
  const supabase = createServiceRoleClient(source);
  const summary = await runWorkerArticleSummary(data.rawText, source);

  const article = await upsertArticle(supabase, {
    topic_id: data.topicId,
    url_hash: createHash("sha256").update(data.sourceUrl).digest("hex"),
    source_url: data.sourceUrl,
    source_name: data.sourceName,
    title: data.title,
    tldr_bullets: summary.tldr,
    body: summary.body,
    read_minutes: summary.readMinutes,
    sentiment: summary.sentiment,
    audio_url: null,
    published_at: data.publishedAt,
  });

  logger.info("Summarize pipeline completed", {
    topicId: article.topic_id,
    articleId: article.id,
    sourceUrl: article.source_url,
  });

  return {
    articleId: article.id,
    topicId: article.topic_id,
    sourceUrl: article.source_url,
  };
}
