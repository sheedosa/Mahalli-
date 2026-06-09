import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHandler } from "@/lib/jobs/handlers";
import { isExhausted, nextBackoffMs } from "@/lib/jobs/backoff";
import { log } from "@/lib/log";

export type WorkerResult = { processed: number; sent: number; failed: number };

/**
 * Claim a batch of due outbox jobs (service-role, FOR UPDATE SKIP LOCKED via the
 * `dequeue_messages` RPC), dispatch each by `kind`, and finalize it: sent on
 * success, retried with exponential backoff on failure, failed once exhausted.
 */
export async function runWorker(batchSize = 10): Promise<WorkerResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("dequeue_messages", { p_limit: batchSize });
  if (error) {
    log.error("worker.dequeue_failed", { error: error.message });
    throw new Error(error.message);
  }

  const rows = data ?? [];
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const handler = getHandler(row.kind);
    try {
      if (!handler) throw new Error(`no handler for kind '${row.kind}'`);
      await handler((row.payload ?? {}) as Record<string, unknown>, {
        id: row.id,
        sellerId: row.seller_id,
        attempts: row.attempts,
      });
      await supabase.rpc("complete_message", { p_id: row.id, p_ok: true });
      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const giveUp = isExhausted(row.attempts);
      const p_next = giveUp
        ? undefined
        : new Date(Date.now() + nextBackoffMs(row.attempts)).toISOString();
      await supabase.rpc("complete_message", {
        p_id: row.id,
        p_ok: false,
        p_error: message,
        p_next,
      });
      failed++;
      log.warn("worker.job_failed", {
        id: row.id,
        kind: row.kind,
        attempts: row.attempts,
        giveUp,
        error: message,
      });
    }
  }

  return { processed: rows.length, sent, failed };
}
