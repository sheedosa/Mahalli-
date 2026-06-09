import { describe, it, expect } from "vitest";
import { renderNotification, type NotifyType } from "@/lib/messaging/templates";

const data = { shopName: "Layla", buyerName: "Sara", orderRef: "#1a2b3c4d", total: "100 LYD" };
const types: NotifyType[] = ["order_placed", "order_confirmed", "order_out", "order_delivered"];

describe("renderNotification", () => {
  it("renders every type in both locales with no leftover placeholders", () => {
    for (const locale of ["ar", "en"] as const) {
      for (const t of types) {
        const { template, body } = renderNotification(t, locale, data);
        expect(template).toBe(t);
        expect(body.length).toBeGreaterThan(0);
        expect(body).not.toMatch(/\$\{/); // no unresolved template literals
        expect(body).toContain("Layla");
      }
    }
  });

  it("includes the order ref and (for placed) the total", () => {
    const en = renderNotification("order_placed", "en", data);
    expect(en.body).toContain("#1a2b3c4d");
    expect(en.body).toContain("100 LYD");
  });

  it("handles a missing buyer name without a dangling separator", () => {
    const en = renderNotification("order_confirmed", "en", { ...data, buyerName: null });
    expect(en.body).not.toContain(", !");
    expect(en.body).not.toMatch(/\s{2,}/); // whitespace normalized
  });

  it("falls back to Arabic for an unknown locale", () => {
    // @ts-expect-error exercising the runtime fallback
    const out = renderNotification("order_out", "fr", data);
    expect(out.body).toContain("الطريق");
  });
});
