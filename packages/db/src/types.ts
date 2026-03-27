export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled";
export type TopicFrequency = "daily" | "weekly" | "realtime";
export type ArticleSentiment = "positive" | "negative" | "neutral";
export type BillingProvider = "stripe";
export type BillingPlanCode = "go" | "pro";
export type BillingSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired";
export type CheckoutSessionStatus = "open" | "complete" | "expired";

export interface TopicConfig {
  signals: string[];
  exclude: string[];
  searchQuery: string;
}

export interface User {
  id: string;
  email: string;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  preferred_voice: string | null;
  created_at: string;
}

export interface Topic {
  id: string;
  user_id: string;
  name: string;
  category: string;
  config: TopicConfig;
  frequency: TopicFrequency;
  last_fetched_at: string | null;
  is_active: boolean;
}

export interface Article {
  id: string;
  topic_id: string;
  url_hash: string;
  source_url: string;
  source_name: string;
  title: string;
  tldr_bullets: string[];
  body: string;
  read_minutes: number;
  sentiment: ArticleSentiment;
  audio_url: string | null;
  published_at: string;
  created_at: string;
}

export interface ArticleRead {
  user_id: string;
  article_id: string;
  read_at: string;
  listened_at: string | null;
}

export interface BillingSubscription {
  id: string;
  user_id: string;
  provider: BillingProvider;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  plan_code: BillingPlanCode;
  status: BillingSubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckoutSession {
  id: string;
  user_id: string;
  stripe_checkout_session_id: string;
  plan_code: BillingPlanCode;
  stripe_price_id: string;
  status: CheckoutSessionStatus;
  created_at: string;
  completed_at: string | null;
}

export interface BillingEvent {
  id: number;
  event_id: string;
  provider: BillingProvider;
  event_type: string;
  livemode: boolean;
  payload: Record<string, unknown>;
  processed_at: string | null;
  created_at: string;
}

export interface TopicRefinementResult extends TopicConfig {
  topic: string;
  category: string;
}

export interface ArticleCandidate {
  sourceUrl: string;
  sourceName: string;
  title: string;
  publishedAt: string;
  content: string;
}

export interface ArticleSummary {
  tldr: string[];
  body: string;
  readMinutes: number;
  sentiment: ArticleSentiment;
  keyEntities: string[];
}

export interface NewArticleRecord {
  topic_id: string;
  url_hash: string;
  source_url: string;
  source_name: string;
  title: string;
  tldr_bullets: string[];
  body: string;
  read_minutes: number;
  sentiment: ArticleSentiment;
  audio_url: string | null;
  published_at: string;
}

export interface NewsflowDatabase {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: User;
        Update: Partial<User>;
        Relationships: [];
      };
      topics: {
        Row: Topic;
        Insert: Topic;
        Update: Partial<Topic>;
        Relationships: [];
      };
      articles: {
        Row: Article;
        Insert: NewArticleRecord;
        Update: Partial<Article>;
        Relationships: [];
      };
      article_reads: {
        Row: ArticleRead;
        Insert: ArticleRead;
        Update: Partial<ArticleRead>;
        Relationships: [];
      };
      billing_subscriptions: {
        Row: BillingSubscription;
        Insert: BillingSubscription;
        Update: Partial<BillingSubscription>;
        Relationships: [];
      };
      checkout_sessions: {
        Row: CheckoutSession;
        Insert: CheckoutSession;
        Update: Partial<CheckoutSession>;
        Relationships: [];
      };
      billing_events: {
        Row: BillingEvent;
        Insert: BillingEvent;
        Update: Partial<BillingEvent>;
        Relationships: [];
      };
    };
  };
}
