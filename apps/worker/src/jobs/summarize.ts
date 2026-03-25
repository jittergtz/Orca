import { createHash } from "crypto";
import type { EnvSource } from "@newsflow/config";
import { summarizeArticle } from "@newsflow/ai";
import {
  createServiceRoleClient,
  upsertArticle,
} from "@newsflow/db";
import type { SummarizeArticleJobData } from "../queue";

export async function summarizeJob(data: SummarizeArticleJobData, source?: EnvSource) {
  const supabase = createServiceRoleClient(source);
  const summary = await summarizeArticle(data.rawText, source);

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

  return {
    articleId: article.id,
    topicId: article.topic_id,
  };
}
