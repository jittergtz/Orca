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

export type FeedStatus = "idle" | "loading" | "ready" | "error";
export type RealtimeStatus = "idle" | "connecting" | "subscribed" | "error";

type FeedRealtimeSubscription = {
  unsubscribe: () => Promise<unknown>;
};

type FeedSnapshot = {
  topics: Topic[];
  articlesByTopic: Record<string, Article[]>;
  readArticleIds: Record<string, true>;
};

let bootstrapRequestId = 0;
let topicsRefreshRequestId = 0;
let topicRefreshRequestIds: Record<string, number> = {};
let topicsRefreshTimer: ReturnType<typeof setTimeout> | null = null;
const topicRefreshTimers = new Map<string, ReturnType<typeof setTimeout>>();

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function hasLoadedTopic(
  articlesByTopic: Record<string, Article[]>,
  topicId: string
) {
  return Object.prototype.hasOwnProperty.call(articlesByTopic, topicId);
}

function addPendingId(ids: Record<string, true>, id: string) {
  const nextIds: Record<string, true> = { ...ids };
  nextIds[id] = true;
  return nextIds;
}

function removePendingId(ids: Record<string, true>, id: string) {
  const nextIds = { ...ids };
  delete nextIds[id];
  return nextIds;
}

function clearScheduledRefreshes() {
  if (topicsRefreshTimer) {
    clearTimeout(topicsRefreshTimer);
    topicsRefreshTimer = null;
  }

  topicRefreshTimers.forEach((timer) => clearTimeout(timer));
  topicRefreshTimers.clear();
}

async function disposeRealtimeSubscription(subscription: FeedRealtimeSubscription | null) {
  if (!subscription) {
    return;
  }

  await subscription.unsubscribe();
}

async function loadArticlesForTopics(topicIds: string[]) {
  const client = getDesktopSupabaseClient();
  const entries = await Promise.all(
    topicIds.map(async (topicId) => {
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

async function loadFeedSnapshot(userId: string): Promise<FeedSnapshot> {
  const topics = await listTopicsForUser(getDesktopSupabaseClient(), userId);
  const [articlesByTopic, readArticleIds] = await Promise.all([
    loadArticlesForTopics(topics.map((topic) => topic.id)),
    loadArticleReadIdsForUser(userId),
  ]);

  return { topics, articlesByTopic, readArticleIds };
}

interface FeedStore {
  status: FeedStatus;
  realtimeStatus: RealtimeStatus;
  topics: Topic[];
  articlesByTopic: Record<string, Article[]>;
  readArticleIds: Record<string, true>;
  pendingTopicIds: Record<string, true>;
  pendingReadArticleIds: Record<string, true>;
  activeTopicId: string | null;
  activeArticleIndex: number;
  bootstrappedUserId: string | null;
  isRefreshing: boolean;
  lastSyncedAt: number | null;
  error: string | null;
  realtimeSubscription: FeedRealtimeSubscription | null;
  prepareForUser: (userId: string) => void;
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
  pendingTopicIds: {},
  pendingReadArticleIds: {},
  activeTopicId: null,
  activeArticleIndex: 0,
  bootstrappedUserId: null,
  isRefreshing: false,
  lastSyncedAt: null,
  error: null,
  realtimeSubscription: null,
  prepareForUser: (userId) => {
    const currentState = get();
    const isSameReadyUser =
      currentState.status === "ready" && currentState.bootstrappedUserId === userId;

    if (isSameReadyUser) {
      return;
    }

    bootstrapRequestId += 1;
    topicsRefreshRequestId += 1;
    topicRefreshRequestIds = {};
    clearScheduledRefreshes();

    set({
      status: "loading",
      error: null,
      isRefreshing: false,
      bootstrappedUserId: userId,
      topics: [],
      articlesByTopic: {},
      readArticleIds: {},
      pendingTopicIds: {},
      pendingReadArticleIds: {},
      activeTopicId: null,
      activeArticleIndex: 0,
    });
  },
  bootstrap: async (userId) => {
    const currentState = get();
    const isAlreadyBootstrapped =
      currentState.status === "ready" && currentState.bootstrappedUserId === userId;

    if (isAlreadyBootstrapped) {
      return;
    }

    get().prepareForUser(userId);
    const requestId = ++bootstrapRequestId;

    try {
      const snapshot = await loadFeedSnapshot(userId);

      if (requestId !== bootstrapRequestId) {
        return;
      }

      set({
        status: "ready",
        topics: snapshot.topics,
        activeTopicId: null,
        activeArticleIndex: 0,
        bootstrappedUserId: userId,
        articlesByTopic: snapshot.articlesByTopic,
        readArticleIds: snapshot.readArticleIds,
        pendingTopicIds: {},
        pendingReadArticleIds: {},
        isRefreshing: false,
        lastSyncedAt: Date.now(),
        error: null,
      });

      await get().subscribeRealtime(userId);
    } catch (error) {
      if (requestId !== bootstrapRequestId) {
        return;
      }

      set({
        status: "error",
        isRefreshing: false,
        error: getErrorMessage(error, "Could not load topics"),
      });
    }
  },
  setActiveTopic: async (topicId) => {
    set({ activeTopicId: topicId, activeArticleIndex: 0 });

    if (
      topicId &&
      !hasLoadedTopic(get().articlesByTopic, topicId) &&
      !get().pendingTopicIds[topicId]
    ) {
      await get().refreshTopic(topicId);
    }
  },
  setActiveArticleIndex: (index) => {
    const activeTopicId = get().activeTopicId;
    const articleCount = activeTopicId ? get().articlesByTopic[activeTopicId]?.length ?? 0 : 0;
    const nextIndex = articleCount > 0 ? Math.max(0, Math.min(index, articleCount - 1)) : 0;

    set({ activeArticleIndex: nextIndex });
  },
  refreshTopic: async (topicId) => {
    const requestId = (topicRefreshRequestIds[topicId] ?? 0) + 1;
    topicRefreshRequestIds = { ...topicRefreshRequestIds, [topicId]: requestId };

    set((state) => ({
      pendingTopicIds: addPendingId(state.pendingTopicIds, topicId),
      error: null,
    }));

    try {
      const articles = await listArticlesForTopic(getDesktopSupabaseClient(), topicId);

      if (topicRefreshRequestIds[topicId] !== requestId) {
        return;
      }

      set((state) => ({
        activeArticleIndex:
          state.activeTopicId === topicId
            ? Math.min(state.activeArticleIndex, Math.max(articles.length - 1, 0))
            : state.activeArticleIndex,
        articlesByTopic: {
          ...state.articlesByTopic,
          [topicId]: articles,
        },
        lastSyncedAt: Date.now(),
      }));
    } catch (error) {
      if (topicRefreshRequestIds[topicId] !== requestId) {
        return;
      }

      set({
        error: getErrorMessage(error, "Could not refresh topic"),
      });
    } finally {
      if (topicRefreshRequestIds[topicId] === requestId) {
        set((state) => ({
          pendingTopicIds: removePendingId(state.pendingTopicIds, topicId),
        }));
      }
    }
  },
  refreshTopics: async (userId) => {
    const requestId = ++topicsRefreshRequestId;
    const hadReadyData = get().status === "ready";

    set({
      status: hadReadyData ? "ready" : "loading",
      isRefreshing: hadReadyData,
      error: null,
      bootstrappedUserId: userId,
    });

    try {
      const snapshot = await loadFeedSnapshot(userId);

      if (requestId !== topicsRefreshRequestId) {
        return;
      }

      const { activeArticleIndex, activeTopicId } = get();
      const nextActiveTopicId =
        activeTopicId && snapshot.topics.some((topic) => topic.id === activeTopicId)
          ? activeTopicId
          : null;
      const nextArticleCount = nextActiveTopicId
        ? snapshot.articlesByTopic[nextActiveTopicId]?.length ?? 0
        : 0;

      set({
        status: "ready",
        topics: snapshot.topics,
        activeTopicId: nextActiveTopicId,
        activeArticleIndex:
          nextActiveTopicId === activeTopicId
            ? Math.min(activeArticleIndex, Math.max(nextArticleCount - 1, 0))
            : 0,
        articlesByTopic: snapshot.articlesByTopic,
        readArticleIds: snapshot.readArticleIds,
        isRefreshing: false,
        lastSyncedAt: Date.now(),
        error: null,
      });
    } catch (error) {
      if (requestId !== topicsRefreshRequestId) {
        return;
      }

      set({
        status: hadReadyData ? "ready" : "error",
        isRefreshing: false,
        error: getErrorMessage(error, "Could not refresh topics"),
      });
    }
  },
  refreshArticleReads: async (userId) => {
    const targetUserId = userId ?? get().bootstrappedUserId;

    if (!targetUserId) {
      return;
    }

    const readArticleIds = await loadArticleReadIdsForUser(targetUserId);
    set({ readArticleIds, lastSyncedAt: Date.now() });
  },
  markArticleAsRead: async (articleId) => {
    const userId = get().bootstrappedUserId;

    if (!userId || get().readArticleIds[articleId] || get().pendingReadArticleIds[articleId]) {
      return;
    }

    set((state) => ({
      readArticleIds: addPendingId(state.readArticleIds, articleId),
      pendingReadArticleIds: addPendingId(state.pendingReadArticleIds, articleId),
    }));

    try {
      await markArticleRead(getDesktopSupabaseClient(), { userId, articleId });
    } catch (error) {
      console.warn("Failed to persist article read state", error);
      set((state) => ({
        readArticleIds: removePendingId(state.readArticleIds, articleId),
        error: getErrorMessage(error, "Could not save read state"),
      }));
    } finally {
      set((state) => ({
        pendingReadArticleIds: removePendingId(state.pendingReadArticleIds, articleId),
      }));
    }
  },
  subscribeRealtime: async (userId) => {
    await disposeRealtimeSubscription(get().realtimeSubscription);

    if (get().bootstrappedUserId !== userId) {
      return;
    }

    const client = getDesktopSupabaseClient();
    set({ realtimeStatus: "connecting", realtimeSubscription: null });

    const channel = client
      .channel(`newsflow-feed:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "topics", filter: `user_id=eq.${userId}` },
        () => {
          if (topicsRefreshTimer) {
            clearTimeout(topicsRefreshTimer);
          }

          topicsRefreshTimer = setTimeout(() => {
            void get().refreshTopics(userId);
          }, 140);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "articles" },
        (payload) => {
          const record = (payload.new || payload.old || {}) as { topic_id?: string };
          const topicId = record.topic_id;

          if (!topicId || !get().topics.some((topic) => topic.id === topicId)) {
            return;
          }

          const existingTimer = topicRefreshTimers.get(topicId);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }

          const nextTimer = setTimeout(() => {
            topicRefreshTimers.delete(topicId);
            void get().refreshTopic(topicId);
          }, 120);
          topicRefreshTimers.set(topicId, nextTimer);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "article_reads", filter: `user_id=eq.${userId}` },
        () => {
          void get().refreshArticleReads(userId);
        }
      );

    channel.subscribe((status) => {
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
    bootstrapRequestId += 1;
    topicsRefreshRequestId += 1;
    topicRefreshRequestIds = {};
    clearScheduledRefreshes();
    await disposeRealtimeSubscription(get().realtimeSubscription);
    set({
      status: "idle",
      realtimeSubscription: null,
      realtimeStatus: "idle",
      topics: [],
      articlesByTopic: {},
      readArticleIds: {},
      pendingTopicIds: {},
      pendingReadArticleIds: {},
      bootstrappedUserId: null,
      activeTopicId: null,
      activeArticleIndex: 0,
      isRefreshing: false,
      lastSyncedAt: null,
      error: null,
    });
  },
}));
