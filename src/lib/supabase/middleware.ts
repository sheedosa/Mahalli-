import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

/**
 * Refreshes the Supabase auth session on every request and re-issues cookies.
 * Returns the (possibly mutated) response plus the resolved user so the
 * caller can make routing decisions without a second round-trip.
 *
 * IMPORTANT (per Supabase SSR guidance): do not run arbitrary logic between
 * creating the client and calling getUser(), or you risk logging users out at
 * random.
 */
export async function updateSession(request: NextRequest) {
  // Forward the (possibly mutated) request headers — e.g. the CSP nonce — so
  // they reach the rendered page.
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
