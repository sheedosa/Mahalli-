"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

/**
 * Browser Supabase client. Uses the publishable (anon) key only — RLS scopes
 * every read/write to the signed-in user's tenant. Never put the service-role
 * key here.
 */
export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
  );
}
