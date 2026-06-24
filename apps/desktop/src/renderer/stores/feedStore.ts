import { create } from "zustand";
import {
  listArticlesForTopic,
  listTopicsForUser,
  markArticleRead,
  type ArticleRead,
  type Article,
  type Topic,
} from "@newsflow/db";
import { getDesktopSupabaseClient } from "../lib/supabase";

type FeedStatus = "idle" | "loading" | "ready" | "error";
type RealtimeStatus = "idle" | "connecting" | "subscribed" | "error";

type FeedRealtimeSubscription = {
  unsubscribe: () => Promise<unknown>;
};

async function loadArticlesForTopics(topicIds: string[]) {
  const client = getDesktopSupabaseClient();
  const entries = await Promise.all(
    topicIds.map(async topicId => {
      const articles = await listArticlesForTopic(client, topicId);
      return [topicId, articles] as const;
    })
  );

  return entries.reduce<Record<string, Article[]>>((articlesByTopic, [topicId, articles]) => {
    articlesByTopic[topicId] = articles;
    return articlesByTopic;
  }, {});
}

async function loadArticleReadIdsForUser(userId: string) {
  const { data, error } = await getDesktopSupabaseClient()
    .from("article_reads")
    .select("article_id")
    .eq("user_id", userId);

  if (error) {
    console.warn("Failed to load article read state", error);
    return {};
  }

  return ((data as Pick<ArticleRead, "article_id">[]) ?? []).reduce<Record<string, true>>(
    (readIds, row) => {
      readIds[row.article_id] = true;
      return readIds;
    },
    {}
  );
}

async function disposeRealtimeSubscription(subscription: FeedRealtimeSubscription | null) {
  if (!subscription) {
    return;
  }

  await subscription.unsubscribe();
}

interface FeedStore {
  status: FeedStatus;
  realtimeStatus: RealtimeStatus;
  topics: Topic[];
  articlesByTopic: Record<string, Article[]>;
  readArticleIds: Record<string, true>;
  activeTopicId: string | null;
  activeArticleIndex: number;
  bootstrappedUserId: string | null;
  error: string | null;
  realtimeSubscription: FeedRealtimeSubscription | null;
  bootstrap: (userId: string) => Promise<void>;
  setActiveTopic: (topicId: string | null) => Promise<void>;
  setActiveArticleIndex: (index: number) => void;
  refreshTopic: (topicId: string) => Promise<void>;
  refreshTopics: (userId: string) => Promise<void>;
  refreshArticleReads: (userId?: string) => Promise<void>;
  markArticleAsRead: (articleId: string) => Promise<void>;
  subscribeRealtime: (userId: string) => Promise<void>;
  teardownRealtime: () => Promise<void>;
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  status: "idle",
  realtimeStatus: "idle",
  topics: [],
  articlesByTopic: {},
  readArticleIds: {},
  activeTopicId: null,
  activeArticleIndex: 0,
  bootstrappedUserId: null,
  error: null,
  realtimeSubscription: null,
  bootstrap: async (userId: string) => {
    const currentState = get();
    const isAlreadyBootstrapped =
      currentState.status === "ready" && currentState.bootstrappedUserId === userId;

    if (isAlreadyBootstrapped) {
      return;
    }

    set({ status: "loading", error: null });

    try {
      const topics = await listTopicsForUser(getDesktopSupabaseClient(), userId);
      const articlesByTopic = await loadArticlesForTopics(topics.map(topic => topic.id));
      const readArticleIds = await loadArticleReadIdsForUser(userId);

      set({
        status: "ready",
        topics,
        activeTopicId: null,
        activeArticleIndex: 0,
        bootstrappedUserId: userId,
        articlesByTopic,
        readArticleIds,
      });

      await get().subscribeRealtime(userId);
    } catch (error) {
      set({
        status: "error",
        error: error instanceof Error ? error.message : "Could not load topics",
      });
    }
  },
  setActiveTopic: async (topicId: string | null) => {
    set({ activeTopicId: topicId, activeArticleIndex: 0 });

    if (topicId && !get().articlesByTopic[topicId]) {
      await get().refreshTopic(topicId);
    }
  },
  setActiveArticleIndex: (index: number) => {
    const activeTopicId = get().activeTopicId;
    const articleCount = activeTopicId ? get().articlesByTopic[activeTopicId]?.length ?? 0 : 0;
    const nextIndex = articleCount > 0 ? Math.max(0, Math.min(index, articleCount - 1)) : 0;

    set({ activeArticleIndex: nextIndex });
  },
  refreshTopic: async (topicId: string) => {
    const client = getDesktopSupabaseClient();
    const articles = await listArticlesForTopic(client, topicId);

    set(state => ({
      activeArticleIndex:
        state.activeTopicId === topicId
          ? Math.min(state.activeArticleIndex, Math.max(articles.length - 1, 0))
          : state.activeArticleIndex,
      articlesByTopic: {
        ...state.articlesByTopic,
        [topicId]: articles,
      },
    }));
  },
  refreshTopics: async (userId: string) => {
    const topics = await listTopicsForUser(getDesktopSupabaseClient(), userId);
    const articlesByTopic = await loadArticlesForTopics(topics.map(topic => topic.id));
    const { activeArticleIndex, activeTopicId } = get();
    const nextActiveTopicId =
      activeTopicId && topics.some(topic => topic.id === activeTopicId)
        ? activeTopicId
        : null;
    const nextArticleCount = nextActiveTopicId ? articlesByTopic[nextActiveTopicId]?.length ?? 0 : 0;

    set({
      topics,
      activeTopicId: nextActiveTopicId,
      activeArticleIndex:
        nextActiveTopicId === activeTopicId
          ? Math.min(activeArticleIndex, Math.max(nextArticleCount - 1, 0))
          : 0,
      articlesByTopic,
    });
  },
  refreshArticleReads: async (userId?: string) => {
    const targetUserId = userId ?? get().bootstrappedUserId;

    if (!targetUserId) {
      return;
    }

    const readArticleIds = await loadArticleReadIdsForUser(targetUserId);
    set({ readArticleIds });
  },
  markArticleAsRead: async (articleId: string) => {
    const userId = get().bootstrappedUserId;

    if (!userId || get().readArticleIds[articleId]) {
      return;
    }

    set(state => ({
      readArticleIds: {
        ...state.readArticleIds,
        [articleId]: true,
      },
    }));

    try {
      await markArticleRead(getDesktopSupabaseClient(), { userId, articleId });
    } catch (error) {
      console.warn("Failed to persist article read state", error);
    }
  },
  subscribeRealtime: async (userId: string) => {
    await disposeRealtimeSubscription(get().realtimeSubscription);

    const client = getDesktopSupabaseClient();
    set({ realtimeStatus: "connecting", realtimeSubscription: null });

    const channel = client
      .channel(`newsflow-feed:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "topics", filter: `user_id=eq.${userId}` },
        () => {
          void get().refreshTopics(userId);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "articles" },
        payload => {
          const record = (payload.new || payload.old || {}) as { topic_id?: string };
          const topicId = record.topic_id;

          if (!topicId) {
            return;
          }

          if (!get().topics.some(topic => topic.id === topicId)) {
            return;
          }

          void get().refreshTopic(topicId);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "article_reads", filter: `user_id=eq.${userId}` },
        () => {
          void get().refreshArticleReads(userId);
        }
      );

    channel.subscribe(status => {
      if (status === "SUBSCRIBED") {
        set({ realtimeStatus: "subscribed" });
        return;
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        set({ realtimeStatus: "error" });
      }
    });

    set({
      realtimeSubscription: channel as FeedRealtimeSubscription,
    });
  },
  teardownRealtime: async () => {
    await disposeRealtimeSubscription(get().realtimeSubscription);
    set({
      realtimeSubscription: null,
      realtimeStatus: "idle",
      bootstrappedUserId: null,
      readArticleIds: {},
      activeTopicId: null,
      activeArticleIndex: 0,
    });
  },
}));
