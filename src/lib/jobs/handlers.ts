import { log } from "@/lib/log";

// A job handler does the side effect for one outbox row. It must be idempotent
// (the row may be retried) and throw on failure so the worker backs it off.
export type JobHandler = (payload: Record<string, unknown>, ctx: JobContext) => Promise<void>;

export type JobContext = {
  id: string;
  sellerId: string;
  attempts: number;
};

// Registry keyed by message_outbox.kind. Phase-2 workstreams register their
// handlers here: 'broadcast' (P2), 'catalog_sync' (P3), 'payment_reconcile' (P4).
export const handlers: Record<string, JobHandler> = {
  noop: async (payload, ctx) => {
    log.info("job.noop", { id: ctx.id, sellerId: ctx.sellerId, payload });
  },
  // Lazy import keeps the server-only messaging deps out of unrelated bundles.
  notify: async (payload, ctx) => {
    const { notifyHandler } = await import("@/lib/jobs/handlers/notify");
    return notifyHandler(payload, ctx);
  },
};

export function getHandler(kind: string): JobHandler | undefined {
  return handlers[kind];
}
