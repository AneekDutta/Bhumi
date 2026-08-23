/**
 * The single Supabase browser client.
 *
 * Session persistence and token refresh are handled by supabase-js itself
 * (localStorage under `storageKey`), which is what makes an existing session
 * survive a page reload.
 */
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

if (!isSupabaseConfigured) {
  console.error(
    "[supabase] Missing Supabase credentials — sign-in and data loading will fail. " +
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "ps18-shg-auth",
  },
});

export const supabaseUrl = SUPABASE_URL;
export const supabaseAnonKey = SUPABASE_ANON_KEY;

export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

