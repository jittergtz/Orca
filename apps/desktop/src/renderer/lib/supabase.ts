import type { EnvSource } from "@newsflow/config";
import {
  createBrowserClient,
  type NewsflowSupabaseClient,
} from "@newsflow/db";

let desktopSupabaseClient: NewsflowSupabaseClient | null = null;

function readRendererEnv(): EnvSource {
  return (import.meta.env as Record<string, string | undefined>) satisfies EnvSource;
}

export function getDesktopSupabaseClient() {
  if (!desktopSupabaseClient) {
    desktopSupabaseClient = createBrowserClient(readRendererEnv());
  }

  return desktopSupabaseClient;
}
