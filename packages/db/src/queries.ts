import type {
  Article,
  ArticleRead,
  NewArticleRecord,
  Topic,
  User,
} from "./types";
import type { NewsflowSupabaseClient } from "./client";

export async function getCurrentUserProfile(client: NewsflowSupabaseClient, userId: string) {
  const { data, error } = await client.from("users").select("*").eq("id", userId).single();

  if (error) {
    throw error;
  }

  return data as User;
}

export async function getTopicById(client: NewsflowSupabaseClient, topicId: string) {
  const { data, error } = await client.from("topics").select("*").eq("id", topicId).maybeSingle();

  if (error) {
    throw error;
  }

  return (data as Topic | null) ?? null;
}

export async function listTopicsForUser(client: NewsflowSupabaseClient, userId: string) {
  const { data, error } = await client
    .from("topics")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as Topic[]) ?? [];
}

export async function listActiveTopics(client: NewsflowSupabaseClient) {
  const { data, error } = await client
    .from("topics")
    .select("*")
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return (data as Topic[]) ?? [];
}

export function isTopicDue(topic: Topic, now = new Date()) {
  if (!topic.last_fetched_at) {
    return true;
  }

  const lastFetchedAt = new Date(topic.last_fetched_at).getTime();
  const ageMs = now.getTime() - lastFetchedAt;

  if (topic.frequency === "realtime") {
    return ageMs >= 15 * 60 * 1000;
  }

  if (topic.frequency === "daily") {
    return ageMs >= 24 * 60 * 60 * 1000;
  }

  return ageMs >= 7 * 24 * 60 * 60 * 1000;
}

export async function listDueTopics(client: NewsflowSupabaseClient, now = new Date()) {
  const topics = await listActiveTopics(client);
  return topics.filter(topic => isTopicDue(topic, now));
}

export async function listArticlesForTopic(client: NewsflowSupabaseClient, topicId: string, limit = 20) {
  const { data, error } = await client
    .from("articles")
    .select("*")
    .eq("topic_id", topicId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data as Article[]) ?? [];
}

export async function upsertArticle(client: NewsflowSupabaseClient, article: NewArticleRecord) {
  const { data, error } = await (client
    .from("articles") as any)
    .upsert(article, { onConflict: "topic_id,url_hash" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Article;
}

export async function markArticleRead(
  client: NewsflowSupabaseClient,
  payload: { userId: string; articleId: string; listenedAt?: string | null }
) {
  const row: ArticleRead = {
    user_id: payload.userId,
    article_id: payload.articleId,
    read_at: new Date().toISOString(),
    listened_at: payload.listenedAt ?? null,
  };

  const result = await ((client
    .from("article_reads") as any)
    .upsert(row, { onConflict: "user_id,article_id" })
    .select("*")
    .single());

  if (result.error) {
    throw result.error;
  }

  return result.data as ArticleRead;
}

export async function updateTopicFetchTimestamp(
  client: NewsflowSupabaseClient,
  topicId: string,
  fetchedAt = new Date().toISOString()
) {
  const result = await ((client
    .from("topics") as any)
    .update({ last_fetched_at: fetchedAt })
    .eq("id", topicId)
    .select("*")
    .single());

  if (result.error) {
    throw result.error;
  }

  return result.data as Topic;
}
