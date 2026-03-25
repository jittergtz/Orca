import { z } from "zod";

export const TopicConfigSchema = z.object({
  signals: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
  searchQuery: z.string(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  stripe_customer_id: z.string().nullable(),
  subscription_status: z.enum(["active", "trialing", "past_due", "canceled"]),
  subscription_expires_at: z.string().nullable(),
  preferred_voice: z.string().nullable(),
  created_at: z.string(),
});

export const TopicSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  category: z.string(),
  config: TopicConfigSchema,
  frequency: z.enum(["daily", "weekly", "realtime"]),
  last_fetched_at: z.string().nullable(),
  is_active: z.boolean(),
});

export const ArticleSchema = z.object({
  id: z.string(),
  topic_id: z.string(),
  url_hash: z.string(),
  source_url: z.string(),
  source_name: z.string(),
  title: z.string(),
  tldr_bullets: z.array(z.string()),
  body: z.string(),
  read_minutes: z.number(),
  sentiment: z.enum(["positive", "negative", "neutral"]),
  audio_url: z.string().nullable(),
  published_at: z.string(),
  created_at: z.string(),
});

export const ArticleSummarySchema = z.object({
  tldr: z.array(z.string()).min(3).max(4),
  body: z.string(),
  readMinutes: z.number(),
  sentiment: z.enum(["positive", "negative", "neutral"]),
  keyEntities: z.array(z.string()).default([]),
});

export const TopicRefinementSchema = z.object({
  topic: z.string(),
  category: z.string(),
  signals: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
  searchQuery: z.string(),
});

export const ArticleCandidateSchema = z.object({
  sourceUrl: z.string().url(),
  sourceName: z.string(),
  title: z.string(),
  publishedAt: z.string(),
  content: z.string(),
});

export const NewsSearchResponseSchema = z.object({
  articles: z.array(ArticleCandidateSchema).max(10),
});

export const ArticleReadSchema = z.object({
  user_id: z.string(),
  article_id: z.string(),
  read_at: z.string(),
  listened_at: z.string().nullable(),
});
