import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database.types";

/**
 * Enqueue a background job (server-side only; uses the service-role client).
 * Idempotent when `dedupeKey` is provided. Returns the new job id, or null if a
 * dedupe collision skipped the insert.
 */
export async function enqueue(
  kind: string,
  payload: Json,
  opts: { sellerId: string; dedupeKey?: string },
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("enqueue_message", {
    p_seller: opts.sellerId,
    p_kind: kind,
    p_payload: payload,
    p_dedupe_key: opts.dedupeKey,
  });
  if (error) throw new Error(error.message);
  return data ?? null;
}
