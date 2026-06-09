import { NextResponse, type NextRequest } from "next/server";
import { runWorker } from "@/lib/jobs/worker";
import { log } from "@/lib/log";

// Service-role work; never statically optimized.
export const dynamic = "force-dynamic";

/**
 * Outbox worker, invoked on the schedule in vercel.json (Vercel auto-sends
 * `Authorization: Bearer $CRON_SECRET`). The schedule is daily for Hobby-plan
 * compatibility; bump to a higher frequency on Pro when notifications go live.
 * Fails closed when the secret is unset so it can never run unauthenticated.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "worker not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWorker(10);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "worker failed";
    log.error("worker.route_error", { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
