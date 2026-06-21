import { create } from "zustand";
import {
  listArticlesForTopic,
  listTopicsForUser,
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
  subscribeRealtime: (userId: string) => Promise<void>;
  teardownRealtime: () => Promise<void>;
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  status: "idle",
  realtimeStatus: "idle",
  topics: [],
  articlesByTopic: {},
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
      const activeTopicId = topics[0]?.id ?? null;
      const articlesByTopic = await loadArticlesForTopics(topics.map(topic => topic.id));

      set({
        status: "ready",
        topics,
        activeTopicId,
        activeArticleIndex: 0,
        bootstrappedUserId: userId,
        articlesByTopic,
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
        : topics[0]?.id ?? null;
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
    });
  },
}));
