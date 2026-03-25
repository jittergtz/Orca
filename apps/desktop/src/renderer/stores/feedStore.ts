import { create } from "zustand";
import {
  listArticlesForTopic,
  listTopicsForUser,
  type Article,
  type Topic,
} from "@newsflow/db";
import { getDesktopSupabaseClient } from "../lib/supabase";

type FeedStatus = "idle" | "loading" | "ready" | "error";

interface FeedStore {
  status: FeedStatus;
  topics: Topic[];
  articlesByTopic: Record<string, Article[]>;
  activeTopicId: string | null;
  error: string | null;
  bootstrap: (userId: string) => Promise<void>;
  setActiveTopic: (topicId: string | null) => Promise<void>;
  refreshTopic: (topicId: string) => Promise<void>;
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  status: "idle",
  topics: [],
  articlesByTopic: {},
  activeTopicId: null,
  error: null,
  bootstrap: async (userId: string) => {
    set({ status: "loading", error: null });

    try {
      const client = getDesktopSupabaseClient();
      const topics = await listTopicsForUser(client, userId);
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
}));
