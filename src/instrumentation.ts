import { log } from "@/lib/log";

/**
 * Boot-time environment validation. Missing server secrets used to surface
 * only on first use (the worker silently 503ing, admin reads failing); now
 * every cold start logs exactly what is and isn't configured, loudly and
 * structured, without crashing preview deploys.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;

  const missing: string[] = [];
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.CRON_SECRET) missing.push("CRON_SECRET");
  if (!process.env.NEXT_PUBLIC_SITE_URL) missing.push("NEXT_PUBLIC_SITE_URL");

  if (missing.length > 0) {
    log.warn("boot.env_missing", {
      missing,
      impact:
        "service-role features (storefront jobs drain, sitemap shops, background worker) and/or auth email links degrade until these are set",
    });
  } else {
    log.info("boot.env_ok", {});
  }
}
