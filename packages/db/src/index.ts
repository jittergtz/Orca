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
  ArticleRead,
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
  ArticleSummarySchema,
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
  updateTopicFetchTimestamp
} from './queries';
