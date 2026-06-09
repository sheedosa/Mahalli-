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
// handlers here: 'notify' (P1), 'broadcast' (P2), 'catalog_sync' (P3),
// 'payment_reconcile' (P4). F1 ships only a 'noop' so the loop is exercisable.
export const handlers: Record<string, JobHandler> = {
  noop: async (payload, ctx) => {
    log.info("job.noop", { id: ctx.id, sellerId: ctx.sellerId, payload });
  },
};

export function getHandler(kind: string): JobHandler | undefined {
  return handlers[kind];
}
