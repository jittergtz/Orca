import { createHash } from "crypto";
import type { EnvSource } from "@newsflow/config";
import {
  createServiceRoleClient,
  getTopicSummary,
  getTopicById,
  updateTopicFetchTimestamp,
  upsertArticle,
} from "@newsflow/db";
import {
  runWorkerArticleDistillation,
  runWorkerArticleMdxGeneration,
  runWorkerArticleSummary,
  runWorkerNewsSearch,
} from "../ai";
import { resolveWorkerRuntimeEnv } from "../lib/env";
import { logger } from "../lib/logger";
import {
  enqueueSummarizeArticle,
  type FetchNewsJobData,
  type SummarizeArticleJobData,
} from "../queue";
import { acquireArticleAsset } from "./articleAssets";
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

function mdxToPlainText(content: string) {
  return content
    .replace(/<DataTable\b[^>]*\/>/g, "")
    .replace(/<MetricCard\b[^>]*\/>/g, "")
    .replace(/<DataChart\b[^>]*\/>/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
  const runtimeEnv = resolveWorkerRuntimeEnv(source);

  if (runtimeEnv.articleMdxPipelineEnabled) {
    try {
      const topic = await getTopicById(supabase, data.topicId);
      const topicQuery = topic?.config.searchQuery ?? data.topicName;
      const topicSummary = topic?.user_id
        ? await getTopicSummary(supabase, {
            userId: topic.user_id,
            topicQuery,
          })
        : null;
      const distillation = await runWorkerArticleDistillation(
        {
          topicName: data.topicName,
          sourceTitle: data.title,
          sourceUrl: data.sourceUrl,
          rawText: data.rawText,
        },
        source
      );
      const mdx = await runWorkerArticleMdxGeneration(
        {
          topicName: data.topicName,
          sourceTitle: data.title,
          sourceUrl: data.sourceUrl,
          rollingSummary: topicSummary?.rolling_summary ?? null,
          distillation,
        },
        source
      );
      const asset = await acquireArticleAsset(
        {
          imageSearchQuery: mdx.imageSearchQuery,
          sourceUrl: data.sourceUrl,
        },
        source
      );
      const article = await upsertArticle(supabase, {
        topic_id: data.topicId,
        url_hash: createHash("sha256").update(data.sourceUrl).digest("hex"),
        source_url: data.sourceUrl,
        source_name: data.sourceName,
        title: mdx.title || data.title,
        tldr_bullets: mdx.tldr,
        body: mdxToPlainText(mdx.contentMdx),
        read_minutes: mdx.readMinutes,
        sentiment: mdx.sentiment,
        audio_url: null,
        content_mdx: mdx.contentMdx,
        image_url: asset.imageUrl,
        image_attribution: asset.imageAttribution,
        published_at: data.publishedAt,
      });

      logger.info("MDX summarize pipeline completed", {
        topicId: article.topic_id,
        articleId: article.id,
        sourceUrl: article.source_url,
        usedComponents: mdx.usedComponents,
        imageSearchQuery: mdx.imageSearchQuery,
        assetSource: asset.source,
      });

      return {
        articleId: article.id,
        topicId: article.topic_id,
        sourceUrl: article.source_url,
        contentMode: "mdx" as const,
        assetSource: asset.source,
      };
    } catch (error) {
      logger.warn("MDX summarize pipeline failed; falling back to legacy summary", {
        topicId: data.topicId,
        sourceUrl: data.sourceUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

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
    contentMode: "legacy" as const,
  };
}
