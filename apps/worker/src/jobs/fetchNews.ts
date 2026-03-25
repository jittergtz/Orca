import type { EnvSource } from "@newsflow/config";
import {
  createServiceRoleClient,
  getTopicById,
  updateTopicFetchTimestamp,
} from "@newsflow/db";
import { searchNews } from "@newsflow/ai";
import {
  enqueueSummarizeArticle,
  type FetchNewsJobData,
} from "../queue";

export async function fetchNewsJob(data: FetchNewsJobData, source?: EnvSource) {
  const supabase = createServiceRoleClient(source);
  const topic = await getTopicById(supabase, data.topicId);

  if (!topic || !topic.is_active) {
    return { topicId: data.topicId, queued: 0, skipped: true };
  }

  const articles = await searchNews(
    {
      topicName: topic.name,
      topicConfig: topic.config,
    },
    source
  );

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

  return {
    topicId: topic.id,
    queued: articles.length,
    initiatedBy: data.initiatedBy,
  };
}
