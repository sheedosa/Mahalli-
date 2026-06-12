import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/dashboard",
        "/products",
        "/orders",
        "/customers",
        "/broadcasts",
        "/settings",
        "/onboarding",
        "/link",
        "/offline",
      ],
    },
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
  };
}
