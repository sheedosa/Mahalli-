import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

/**
 * Server Supabase client for Server Components, Server Actions and Route
 * Handlers. Bound to the request's cookies so the user's session (and thus
 * their RLS scope) is applied. Still uses the anon key — RLS does the rest.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` was called from a Server Component where mutating
            // cookies is not allowed. Safe to ignore when middleware is
            // refreshing the session.
          }
        },
      },
    },
  );
}
