export interface User {
  id: string
  email: string
  stripe_customer_id: string | null
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled'
  subscription_expires_at: string | null
  preferred_voice: string | null
  created_at: string
}

export interface Topic {
  id: string
  user_id: string
  name: string
  category: string
  config: {
    signals: string[]
    exclude: string[]
    searchQuery: string
  }
  frequency: 'daily' | 'weekly' | 'realtime'
  last_fetched_at: string | null
  is_active: boolean
}

export interface Article {
  id: string
  topic_id: string
  url_hash: string
  source_url: string
  source_name: string
  title: string
  tldr_bullets: string[]
  body: string
  read_minutes: number
  sentiment: 'positive' | 'negative' | 'neutral'
  audio_url: string | null
  published_at: string
  created_at: string
}

export interface ArticleRead {
  user_id: string
  article_id: string
  read_at: string
  listened_at: string | null
}
