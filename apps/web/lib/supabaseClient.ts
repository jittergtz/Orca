import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabase() {
  if (client) return client
  if (typeof window === 'undefined') return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string
  client = createClient(url, key)
  return client
}
