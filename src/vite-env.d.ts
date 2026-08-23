/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://xxxx.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase publishable anon key. Never the service-role key. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** "true" renders the static demo dataset instead of live backend data. */
  readonly VITE_USE_DEMO_DATA?: string;
  /** "true" exposes the development-only seed action. */
  readonly VITE_ALLOW_SEED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
