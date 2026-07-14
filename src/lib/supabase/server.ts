import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Returns a Supabase client for use in Server Components / Route Handlers,
 * or `null` when Supabase credentials are not configured (guest-only mode).
 */
export async function createClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component without a mutable cookie store
          // (e.g. during static rendering). Safe to ignore — middleware
          // will refresh the session on the next request.
        }
      },
    },
  });
}
