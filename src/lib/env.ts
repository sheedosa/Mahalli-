/**
 * Centralised environment access.
 *
 * The public Supabase URL + publishable (anon) key have built-in defaults for
 * the Mahalli project, so the app works out of the box on any host even with no
 * env vars configured. These are PUBLIC, client-safe values by design — the
 * publishable key is meant to ship in the browser bundle, and Row-Level
 * Security is what actually protects data. Set the NEXT_PUBLIC_* env vars to
 * point at a different Supabase project; they override the defaults.
 *
 * Server-only secrets (service-role key) have NO default and are read lazily so
 * a secret can never be bundled client-side.
 */

// Mahalli Supabase project (public values — safe to commit).
const DEFAULT_SUPABASE_URL = "https://wolrnueoxodvezijyrbf.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_xleM4UKcVyZoYOQyI5iZgg_MSF6z9ZJ";

export const publicEnv = {
  get supabaseUrl(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  },
  // Supabase publishable (anon) key — safe for the client; RLS scopes access.
  get supabaseAnonKey(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  },
  // Public origin (auth redirects, storefront links). Empty when not configured
  // — callers that need an absolute URL should check `configuredSiteUrl`.
  get siteUrl(): string {
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  },
  /** The explicitly-configured site URL, or null if unset (don't assume localhost). */
  get configuredSiteUrl(): string | null {
    return process.env.NEXT_PUBLIC_SITE_URL || null;
  },
};

export const serverEnv = {
  get serviceRoleKey(): string {
    if (typeof window !== "undefined") {
      throw new Error("serverEnv must not be accessed in the browser");
    }
    const v = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!v) {
      throw new Error(
        "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY",
      );
    }
    return v;
  },
};
