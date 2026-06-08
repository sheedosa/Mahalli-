/**
 * Centralised, validated environment access.
 *
 * Public vars (NEXT_PUBLIC_*) are the only values that ever reach the browser.
 * Server-only secrets (service-role key) are read lazily and must never be
 * imported into a client component — `serverEnv` throws if used in the browser.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const publicEnv = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  // Supabase publishable key (formerly "anon" key). Safe for the client.
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
