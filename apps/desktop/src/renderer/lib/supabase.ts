import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NewsflowDatabase } from "@newsflow/db";

type NewsflowSupabaseClient = SupabaseClient<NewsflowDatabase>;

let desktopSupabaseClient: NewsflowSupabaseClient | null = null;

function readRendererEnv() {
  const source = import.meta.env as Record<string, string | undefined>;
  const supabaseUrl = source.VITE_SUPABASE_URL || source.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    source.VITE_SUPABASE_ANON_KEY ||
    source.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars in desktop renderer.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function getDesktopSupabaseClient() {
  if (!desktopSupabaseClient) {
    const { supabaseUrl, supabaseAnonKey } = readRendererEnv();
    desktopSupabaseClient = createClient<NewsflowDatabase>(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Electron renderer does not have a real URL bar, so we must use
        // localStorage explicitly and disable URL-based session detection.
        storage: window.localStorage,
        detectSessionInUrl: false,
        persistSession: true,
      },
    });
  }

  return desktopSupabaseClient;
}
