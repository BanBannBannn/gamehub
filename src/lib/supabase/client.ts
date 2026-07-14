import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Returns a Supabase client for use in Client Components, or `null` if
 * the app has not been configured with Supabase credentials yet. Callers
 * must handle the `null` case gracefully — the app is fully playable in
 * guest/offline-only mode without Supabase configured.
 */
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient<Database>(supabaseUrl as string, supabaseAnonKey as string);
}
