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
  error: string | null;
  realtimeSubscription: FeedRealtimeSubscription | null;
  bootstrap: (userId: string) => Promise<void>;
  setActiveTopic: (topicId: string | null) => Promise<void>;
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
  error: null,
  realtimeSubscription: null,
  bootstrap: async (userId: string) => {
    set({ status: "loading", error: null });

    try {
      const topics = await listTopicsForUser(getDesktopSupabaseClient(), userId);
      const activeTopicId = topics[0]?.id ?? null;

      set({
        status: "ready",
        topics,
        activeTopicId,
        articlesByTopic: {},
      });

      if (activeTopicId) {
        await get().refreshTopic(activeTopicId);
      }

      await get().subscribeRealtime(userId);
    } catch (error) {
      set({
        status: "error",
        error: error instanceof Error ? error.message : "Could not load topics",
      });
    }
  },
  setActiveTopic: async (topicId: string | null) => {
    set({ activeTopicId: topicId });

    if (topicId) {
      await get().refreshTopic(topicId);
    }
  },
  refreshTopic: async (topicId: string) => {
    const client = getDesktopSupabaseClient();
    const articles = await listArticlesForTopic(client, topicId);

    set(state => ({
      articlesByTopic: {
        ...state.articlesByTopic,
        [topicId]: articles,
      },
    }));
  },
  refreshTopics: async (userId: string) => {
    const topics = await listTopicsForUser(getDesktopSupabaseClient(), userId);
    const activeTopicId = get().activeTopicId;
    const nextActiveTopicId =
      activeTopicId && topics.some(topic => topic.id === activeTopicId)
        ? activeTopicId
        : topics[0]?.id ?? null;

    set({
      topics,
      activeTopicId: nextActiveTopicId,
    });

    if (nextActiveTopicId) {
      await get().refreshTopic(nextActiveTopicId);
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
    });
  },
}));
