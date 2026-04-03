import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NewsflowDatabase } from "@newsflow/db";

type NewsflowSupabaseClient = SupabaseClient<NewsflowDatabase>;

let desktopSupabaseClient: NewsflowSupabaseClient | null = null;

function readRendererEnv() {
  const source = import.meta.env as unknown as Record<string, string | undefined>;
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
        storageKey: "orca-desktop-auth",
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return desktopSupabaseClient;
}

/**
 * Proactively refresh the Supabase session. Call this on every window focus
 * event so the session stays alive even after the app or system has been idle
 * for longer than the 1-hour access_token lifetime.
 *
 * If the refresh_token is still valid (weeks/months by default in Supabase)
 * this silently swaps in a new access_token. If the refresh_token itself is
 * expired, SIGNED_OUT will fire via onAuthStateChange and the app transitions
 * to the login screen cleanly.
 */
export async function refreshSessionOnFocus(): Promise<void> {
  const client = getDesktopSupabaseClient();
  const { data } = await client.auth.getSession();
  if (!data.session) return; // not logged in — nothing to refresh
  const { error } = await client.auth.refreshSession();
  if (error && error.message !== "Auth session missing!") {
    console.warn("[ORCA] refreshSession on focus failed:", error.message);
  }
}
