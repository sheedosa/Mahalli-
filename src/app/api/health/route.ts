import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

/**
 * Liveness + dependency check for uptime monitors. Reports database
 * reachability and which optional server env vars are configured —
 * booleans only, never values.
 */
export async function GET() {
  let db = false;
  try {
    const supabase = createPublicClient();
    // Cheap anon round-trip: RLS returns no rows, but a 200 proves the DB path.
    const { error } = await supabase
      .from("sellers")
      .select("id", { count: "exact", head: true })
      .limit(1);
    db = !error;
  } catch {
    db = false;
  }

  const env = {
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    cronSecret: Boolean(process.env.CRON_SECRET),
  };

  const ok = db;
  return NextResponse.json(
    { ok, db, env, t: new Date().toISOString() },
    { status: ok ? 200 : 503 },
  );
}
