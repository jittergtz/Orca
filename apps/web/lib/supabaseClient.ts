import type { EnvSource } from '@newsflow/config'
import { createBrowserClient, type NewsflowSupabaseClient } from '@newsflow/db'

let client: NewsflowSupabaseClient | null = null

function readWebEnv(): EnvSource {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  }
}

export function getSupabase() {
  if (client) return client
  if (typeof window === 'undefined') return null
  client = createBrowserClient(readWebEnv())
  return client
}
