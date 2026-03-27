import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  type EnvSource,
  resolvePublicSupabaseEnv,
  resolveServiceRoleSupabaseEnv,
} from "@newsflow/config";
import type { NewsflowDatabase } from "./types";

type ClientOptions = Parameters<typeof createSupabaseClient>[2];

function defaultEnvSource(): EnvSource {
  return (((globalThis as { process?: { env?: EnvSource } }).process?.env ?? {}) as EnvSource);
}

function createTypedClient(url: string, key: string, options?: ClientOptions) {
  return createSupabaseClient<NewsflowDatabase>(url, key, options);
}

export function createClient(options: { supabaseUrl: string; supabaseKey: string; options?: ClientOptions }) {
  return createTypedClient(options.supabaseUrl, options.supabaseKey, options.options);
}

export function createBrowserClient(source: EnvSource, options?: ClientOptions) {
  const { supabaseUrl, supabaseAnonKey } = resolvePublicSupabaseEnv(source);
  return createTypedClient(supabaseUrl, supabaseAnonKey, options);
}

export function createServerClient(source: EnvSource = defaultEnvSource(), options?: ClientOptions) {
  const { supabaseUrl, supabaseAnonKey } = resolvePublicSupabaseEnv(source);
  return createTypedClient(supabaseUrl, supabaseAnonKey, options);
}

export function createServiceRoleClient(source: EnvSource = defaultEnvSource(), options?: ClientOptions) {
  const { supabaseUrl, serviceRoleKey } = resolveServiceRoleSupabaseEnv(source);
  return createTypedClient(supabaseUrl, serviceRoleKey, options);
}

export type NewsflowSupabaseClient = ReturnType<typeof createServerClient>;
