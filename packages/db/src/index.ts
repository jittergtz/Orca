export {
  createClient,
  createBrowserClient,
  createServerClient,
  createServiceRoleClient,
} from './client';

export type {
  User,
  TopicConfig,
  Topic,
  Article,
  ArticleChunk,
  ArticleCandidate,
  ArticleRead,
  ArticleSummary,
  EmbeddingVector,
  NewArticleChunkRecord,
  NewTopicSummaryRecord,
  TopicSummary,
  TopicRefinementResult,
  BillingPlanCode,
  BillingProvider,
  BillingSubscriptionStatus,
  CheckoutSessionStatus,
  BillingSubscription,
  CheckoutSession,
  BillingEvent,
  NewsflowDatabase
} from './types';

export {
  TopicConfigSchema,
  UserSchema,
  BillingPlanCodeSchema,
  BillingProviderSchema,
  BillingSubscriptionStatusSchema,
  CheckoutSessionStatusSchema,
  TopicSchema,
  ArticleSchema,
  ArticleChunkSchema,
  ArticleSummarySchema,
  TopicSummarySchema,
  TopicRefinementSchema,
  ArticleCandidateSchema,
  NewsSearchResponseSchema,
  ArticleReadSchema,
  BillingSubscriptionSchema,
  CheckoutSessionSchema,
  BillingEventSchema
} from './schemas';

export {
  getCurrentUserProfile,
  getTopicById,
  listTopicsForUser,
  listActiveTopics,
  isTopicDue,
  listDueTopics,
  listArticlesForTopic,
  upsertArticle,
  markArticleRead,
  getTopicSummary,
  upsertTopicSummary,
  listArticleChunksForArticle,
  upsertArticleChunks,
  updateTopicFetchTimestamp
} from './queries';
