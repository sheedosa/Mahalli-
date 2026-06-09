import { Store } from "lucide-react";

/** A stylized mini-storefront in a phone frame — pure markup, no data. A cropped
 *  "screen peek" (the top of a storefront, fading out at the bottom) so it reads
 *  as a phone without being a tall slab. Uses the default cream theme. */
export function PhoneMock({ shopName }: { shopName: string }) {
  return (
    <div className="phone" aria-hidden>
      <div className="phone-screen theme-cream sf">
        <div className="phone-notch" />
        <div style={{ padding: "16px 14px 8px", display: "flex", alignItems: "center", gap: 6 }}>
          <Store className="size-4" style={{ color: "var(--accent-deep)" }} />
          <span style={{ fontWeight: 800, fontSize: 13.5 }}>{shopName}</span>
        </div>
        <div style={{ margin: "0 14px", height: 60, borderRadius: 14, background: "var(--hero-grad)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", insetInlineEnd: -14, insetBlockStart: -14, width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
        </div>
        <div style={{ margin: "11px 14px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 12, background: "var(--card)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              <div style={{ aspectRatio: "3 / 4", background: "var(--surface-2)" }} />
              <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ height: 6, width: "72%", borderRadius: 99, background: "var(--z200)" }} />
                <div style={{ height: 8, width: "44%", borderRadius: 99, background: "var(--accent)" }} />
              </div>
            </div>
          ))}
        </div>
        <div className="phone-fade" />
      </div>
    </div>
  );
}
