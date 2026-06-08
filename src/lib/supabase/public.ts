import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

/**
 * Anonymous, session-less Supabase client for public storefront reads/writes
 * that go exclusively through the get_storefront / place_order RPCs. Carries no
 * cookies, so storefront pages aren't tied to a user session and can be cached.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
