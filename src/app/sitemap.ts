import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";

export const revalidate = 3600; // shop list refreshes hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl;
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
  ];

  // Public storefronts. Service-role read (sellers has no anon SELECT policy);
  // if the key is missing the sitemap degrades to the landing page only.
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("sellers")
      .select("slug, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    for (const s of data ?? []) {
      entries.push({
        url: `${base}/${s.slug}`,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  } catch {
    // no service key configured — landing-only sitemap
  }

  return entries;
}
