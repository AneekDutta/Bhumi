/**
 * Frontend runtime configuration for Lekha SHG Digital Ledger.
 *
 * Credentials are read from Vite environment variables (see `.env.example`).
 * The `utils/supabase/info.tsx` values are kept as a backwards-compatible fallback.
 *
 * SECURITY: everything imported from `src/` is bundled into the browser. Only
 * the publishable anon key belongs here — never a service-role key.
 */
import { projectId, publicAnonKey } from "../utils/supabase/info";

const envUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ? import.meta.env.VITE_SUPABASE_URL.trim() : "";
const envAnonKey = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ? import.meta.env.VITE_SUPABASE_ANON_KEY.trim() : "";

const fallbackUrl = projectId ? `https://${projectId}.supabase.co` : "";

export const SUPABASE_URL = envUrl || fallbackUrl;
export const SUPABASE_ANON_KEY = envAnonKey || publicAnonKey || "";

/** True when both credentials came from environment variables. */
export const usingEnvCredentials = Boolean(envUrl && envAnonKey);

/** False when the app has no usable Supabase credentials at all. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const EDGE_FUNCTION_NAME = "make-server-2f910efb";
export const EDGE_FUNCTION_BASE = `${SUPABASE_URL}/functions/v1/${EDGE_FUNCTION_NAME}`;

/**
 * Opt-in: render the static demo dataset from `src/data.ts` instead of live
 * backend data. Never enabled implicitly — the app does not fall back to demo
 * data when the backend fails.
 */
export const USE_DEMO_DATA = typeof import.meta !== "undefined" && import.meta.env?.VITE_USE_DEMO_DATA === "true";

/** Opt-in: expose the development-only seed action. */
export const ALLOW_SEED = typeof import.meta !== "undefined" && import.meta.env?.VITE_ALLOW_SEED === "true";

if (typeof import.meta !== "undefined" && import.meta.env?.DEV && isSupabaseConfigured && !usingEnvCredentials) {
  console.warn(
    "[config] Falling back to generated credentials in utils/supabase/info.tsx. " +
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.",
  );
}
