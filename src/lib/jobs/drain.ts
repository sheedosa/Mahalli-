import "server-only";
import { after } from "next/server";
import { runWorker } from "@/lib/jobs/worker";
import { log } from "@/lib/log";

/**
 * Opportunistically drain the outbox right after an order event, without
 * blocking the response. Notifications go out within seconds instead of
 * waiting for the daily cron (which remains the sweeper for anything missed).
 * Failures here are logged and swallowed: the cron retries everything.
 */
export function drainOutboxSoon() {
  after(async () => {
    try {
      await runWorker(10);
    } catch (err) {
      log.warn("worker.opportunistic_drain_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}
