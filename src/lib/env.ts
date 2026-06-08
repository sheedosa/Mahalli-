/**
 * Centralised, validated environment access.
 *
 * Values are read through getters so importing this module never throws — the
 * check happens only when a value is actually used at runtime. This keeps the
 * production build (which imports route modules to collect page data) from
 * failing just because a var isn't present in the build environment.
 *
 * Public vars (NEXT_PUBLIC_*) are the only values that ever reach the browser
 * and are inlined at build time, so they must be set in the build environment
 * (e.g. Vercel project settings) for the client to work.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local (local) or set it in your host's ` +
        `project settings (e.g. Vercel).`,
    );
  }
  return value;
}

export const publicEnv = {
  get supabaseUrl(): string {
    return required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  // Supabase publishable key (formerly "anon" key). Safe for the client.
  get supabaseAnonKey(): string {
    return required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
  // Public origin of the app (auth redirects, storefront links).
  get siteUrl(): string {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  },
};

/**
 * Server-only secrets. Accessing this in the browser is a programming error
 * and throws immediately so a secret can never be bundled client-side.
 */
export const serverEnv = {
  get serviceRoleKey(): string {
    if (typeof window !== "undefined") {
      throw new Error("serverEnv must not be accessed in the browser");
    }
    return required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  },
};
