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

export const BillingPlanCodeSchema = z.enum(["go", "pro"]);
export const BillingProviderSchema = z.literal("stripe");
export const BillingSubscriptionStatusSchema = z.enum([
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
]);
export const CheckoutSessionStatusSchema = z.enum(["open", "complete", "expired"]);

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
  content_mdx: z.string().nullable(),
  image_url: z.string().nullable(),
  image_attribution: z.string().nullable(),
  published_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const TopicSummarySchema = z.object({
  id: z.string(),
  user_id: z.string(),
  topic_query: z.string(),
  rolling_summary: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ArticleChunkSchema = z.object({
  id: z.string(),
  article_id: z.string(),
  user_id: z.string(),
  chunk_index: z.number().int().nonnegative(),
  content: z.string(),
  embedding: z.array(z.number()).nullable(),
  created_at: z.string(),
});

export const ArticleSummarySchema = z.object({
  tldr: z.array(z.string()).min(3).max(4),
  body: z.string(),
  readMinutes: z.number(),
  sentiment: z.enum(["positive", "negative", "neutral"]),
  keyEntities: z.array(z.string()).default([]),
});

export const ArticleDistilledFactSchema = z.object({
  text: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
});

export const ArticleDistilledQuoteSchema = z.object({
  text: z.string().min(1),
  speaker: z.string().nullable().default(null),
  sourceUrl: z.string().url().optional(),
});

export const ArticleDistilledMetricSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  change: z.string().nullable().default(null),
  context: z.string().nullable().default(null),
});

export const ArticleDistilledTimelineItemSchema = z.object({
  date: z.string().min(1),
  event: z.string().min(1),
});

export const ArticleDistillationSchema = z.object({
  keyFacts: z.array(ArticleDistilledFactSchema).min(1),
  quotes: z.array(ArticleDistilledQuoteSchema).default([]),
  metrics: z.array(ArticleDistilledMetricSchema).default([]),
  timeline: z.array(ArticleDistilledTimelineItemSchema).default([]),
  entities: z.array(z.string()).default([]),
  sourceUrls: z.array(z.string().url()).default([]),
});

export const ArticleMdxComponentNameSchema = z.enum([
  "DataTable",
  "MetricCard",
  "DataChart",
]);

export const ArticleMdxOutputSchema = z.object({
  title: z.string().min(1),
  tldr: z.array(z.string()).min(3).max(4),
  contentMdx: z.string().min(1),
  readMinutes: z.number().positive(),
  sentiment: z.enum(["positive", "negative", "neutral"]),
  imageSearchQuery: z.string().min(1).nullable().default(null),
  usedComponents: z.array(ArticleMdxComponentNameSchema).default([]),
});

export const ArticleAssetSchema = z.object({
  imageUrl: z.string().url().nullable(),
  imageAttribution: z.string().nullable(),
  source: z.enum(["unsplash", "open_graph", "none"]),
});

export const ArticleChunkInputSchema = z.object({
  articleId: z.string(),
  userId: z.string(),
  chunkIndex: z.number().int().nonnegative(),
  content: z.string().min(1),
  embedding: z.array(z.number()).nullable().optional(),
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

export const BillingSubscriptionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  provider: BillingProviderSchema,
  stripe_customer_id: z.string(),
  stripe_subscription_id: z.string(),
  stripe_price_id: z.string(),
  plan_code: BillingPlanCodeSchema,
  status: BillingSubscriptionStatusSchema,
  current_period_start: z.string().nullable(),
  current_period_end: z.string().nullable(),
  cancel_at_period_end: z.boolean(),
  canceled_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CheckoutSessionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  stripe_checkout_session_id: z.string(),
  plan_code: BillingPlanCodeSchema,
  stripe_price_id: z.string(),
  status: CheckoutSessionStatusSchema,
  created_at: z.string(),
  completed_at: z.string().nullable(),
});

export const BillingEventSchema = z.object({
  id: z.number(),
  event_id: z.string(),
  provider: BillingProviderSchema,
  event_type: z.string(),
  livemode: z.boolean(),
  payload: z.record(z.unknown()),
  processed_at: z.string().nullable(),
  created_at: z.string(),
});
