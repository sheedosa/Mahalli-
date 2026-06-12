import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/public";
import type { StorefrontData } from "@/types/storefront";

export const runtime = "edge";
export const alt = "Shop on Mahalli";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const hasArabic = (s: string) => /[؀-ۿݐ-ݿ]/.test(s);

// Per-shop OG card. next/og's built-in font is Latin-only, so Arabic shop
// names fall back to the (always-Latin) shop URL as the headline.
export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("get_storefront", { p_slug: slug });
  const sf = data as unknown as StorefrontData | null;

  const latinName = sf !== null && !hasArabic(sf.shop.name);
  const headline = sf && latinName ? sf.shop.name : `mahalli.app/${slug}`;
  const sub = latinName ? `mahalli.app/${slug}` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f2e7",
          color: "#16291f",
          fontWeight: 800,
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 24,
            background: "#2f9e5e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 48,
          }}
        >
          M
        </div>
        <div style={{ marginTop: 36, fontSize: 72, letterSpacing: -2, maxWidth: 1040, textAlign: "center" }}>
          {headline}
        </div>
        {sub ? (
          <div style={{ marginTop: 20, fontSize: 30, fontWeight: 600, color: "#52525b" }}>{sub}</div>
        ) : null}
        <div style={{ marginTop: 56, fontSize: 26, fontWeight: 700, color: "#2f9e5e" }}>
          Powered by Mahalli
        </div>
      </div>
    ),
    size,
  );
}
