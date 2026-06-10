import { Store } from "lucide-react";

export type MockProduct = { name: string; price: string; tone: string };

/** A stylized mini-storefront in a phone frame — pure markup, no data. Shows
 *  visitors "this is a shop app" at a glance. Themed pink (blush). */
export function PhoneMock({
  shopName,
  products,
}: {
  shopName: string;
  products: MockProduct[];
}) {
  return (
    <div className="phone" aria-hidden>
      <div className="phone-screen theme-blush sf">
        <div className="phone-notch" />
        <div style={{ padding: "13px 13px 6px", display: "flex", alignItems: "center", gap: 6 }}>
          <Store className="size-4" style={{ color: "var(--accent-deep)" }} />
          <span style={{ fontWeight: 800, fontSize: 13 }}>{shopName}</span>
        </div>
        <div style={{ margin: "0 13px", height: 52, borderRadius: 13, background: "var(--hero-grad)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", insetInlineEnd: -12, insetBlockStart: -12, width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,.16)" }} />
        </div>
        <div style={{ margin: "9px 13px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {products.map((p, i) => (
            <div key={i} style={{ borderRadius: 12, background: "var(--card)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              <div style={{ aspectRatio: "3 / 4", background: p.tone }} />
              <div style={{ padding: "6px 8px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 10.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                <span style={{ fontWeight: 800, fontSize: 11, color: "var(--accent-deep)" }}>{p.price}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="phone-fade" />
      </div>
    </div>
  );
}
