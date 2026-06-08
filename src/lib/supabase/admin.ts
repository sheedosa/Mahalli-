import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env";

/**
 * Service-role Supabase client. BYPASSES Row-Level Security — use only in
 * trusted server code that has already done its own authorization and
 * validation (e.g. the storefront order-creation endpoint, webhook handlers,
 * background jobs).
 *
 * The `server-only` import guarantees a build error if this module is ever
 * pulled into a client bundle, so the service-role key can never leak.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    publicEnv.supabaseUrl,
    serverEnv.serviceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
