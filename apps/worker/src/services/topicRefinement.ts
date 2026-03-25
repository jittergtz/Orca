import type { EnvSource } from "@newsflow/config";
import {
  BROAD_CATEGORIES,
  MAX_ARTICLES_PER_FETCH,
} from "@newsflow/config";
import {
  runTopicDialogue,
  type TopicDialogueInput,
} from "@newsflow/ai";

export interface TopicRefinementPreview {
  normalizedName: string;
  category: string;
  frequencyRecommendation: "daily" | "weekly";
  config: {
    signals: string[];
    exclude: string[];
    searchQuery: string;
  };
  fetchPreview: {
    estimatedArticleBatch: number;
    broadCategoryKnown: boolean;
  };
}

export async function previewTopicRefinement(input: TopicDialogueInput, source?: EnvSource): Promise<TopicRefinementPreview> {
  const topic = await runTopicDialogue(input, source);
  const normalizedName = topic.topic.trim();
  const broadCategoryKnown = BROAD_CATEGORIES.includes(topic.category as (typeof BROAD_CATEGORIES)[number]);

  return {
    normalizedName,
    category: topic.category,
    frequencyRecommendation: topic.signals.length > 3 ? "daily" : "weekly",
    config: {
      signals: topic.signals,
      exclude: topic.exclude,
      searchQuery: topic.searchQuery,
    },
    fetchPreview: {
      estimatedArticleBatch: Math.min(MAX_ARTICLES_PER_FETCH, Math.max(3, topic.signals.length + 2)),
      broadCategoryKnown,
    },
  };
}
