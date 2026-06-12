"use client";

import { useState } from "react";
import { ChevronLeft, Check, PackageSearch } from "lucide-react";
import { lookupOrder, type TrackedOrder } from "@/app/[slug]/actions";
import { useI18n } from "@/i18n/provider";
import { formatPrice } from "@/lib/utils";
import { themeClass } from "@/lib/themes";

const PIPELINE = ["new", "confirmed", "ready", "out", "delivered"] as const;

/** Public order-status lookup: ref + phone in, status timeline out. */
export function TrackOrderView({
  slug,
  theme,
  initialRef,
}: {
  slug: string;
  theme: string;
  initialRef: string;
}) {
  const { dict, locale } = useI18n();
  const t = dict.storefront;
  const statusLabels = dict.orders.status;

  const [ref, setRef] = useState(initialRef);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  async function onLookup(e: React.FormEvent) {
    e.preventDefault();
    setErrorKey(null);
    setOrder(null);
    setLoading(true);
    const res = await lookupOrder({ slug, ref, phone });
    setLoading(false);
    if (res.ok) setOrder(res.order);
    else setErrorKey(res.errorKey);
  }

  const errorMsg =
    errorKey === "notFound"
      ? t.trackNotFound
      : errorKey === "rate"
        ? t.errorRate
        : errorKey
          ? t.errorGeneric
          : null;

  const stageIndex = order ? PIPELINE.indexOf(order.status as (typeof PIPELINE)[number]) : -1;
  const cancelled = order?.status === "cancelled";

  return (
    <main className={`${themeClass(theme)} sf`}>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col" style={{ padding: "0 0 32px" }}>
        <div className="topbar">
          <a href={`/${slug}`} aria-label={t.backToShop} className="iconbtn">
            <ChevronLeft className="size-5 flip-x" />
          </a>
          <span className="topbar-title" style={{ flex: 1 }}>{t.trackTitle}</span>
        </div>

        <div className="sf-stack" style={{ padding: "18px 18px 0", gap: 18 }}>
          <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
            {t.trackSub}
          </p>

          <form onSubmit={onLookup} className="sf-stack" style={{ gap: 13 }}>
            <div className="field">
              <label className="label" htmlFor="track-ref">{t.trackRef}</label>
              <input
                className="input"
                id="track-ref"
                required
                dir="ltr"
                maxLength={12}
                placeholder="#A1B2C3D4"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="track-phone">{t.phone}</label>
              <input
                className="input"
                id="track-phone"
                required
                type="tel"
                inputMode="tel"
                dir="ltr"
                maxLength={40}
                placeholder={t.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {errorMsg && <p className="errline" style={{ fontSize: 13 }}>{errorMsg}</p>}

            <button type="submit" className="btn btn-accent btn-pill" disabled={loading}>
              {loading ? dict.common.loading : t.trackCta}
            </button>
          </form>

          {order && (
            <div className="card anim-in" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="sf-row sf-between">
                <span dir="ltr" className="price" style={{ fontSize: 16 }}>#{order.ref}</span>
                <span className={`pill ${cancelled ? "pill-danger" : order.status === "delivered" ? "pill-success" : "pill-accent"}`}>
                  {statusLabels[order.status as keyof typeof statusLabels] ?? order.status}
                </span>
              </div>

              {!cancelled && (
                <ol className="sf-stack" style={{ gap: 0, listStyle: "none", margin: 0, padding: 0 }}>
                  {PIPELINE.map((s, i) => {
                    const done = i <= stageIndex;
                    return (
                      <li key={s} className="sf-row" style={{ gap: 10, paddingBlock: 5 }}>
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            flex: "none",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: done ? "var(--accent)" : "var(--z100)",
                            color: done ? "var(--accent-ink)" : "var(--z400)",
                          }}
                        >
                          {done ? <Check className="size-3.5" /> : <span style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor" }} />}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: done ? 700 : 500, color: done ? "var(--ink)" : "var(--z500)" }}>
                          {statusLabels[s]}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="divider" />

              <div className="sf-stack" style={{ gap: 8 }}>
                {order.items.map((it, i) => (
                  <div key={i} className="sf-row sf-between" style={{ gap: 10, fontSize: 13.5 }}>
                    <span style={{ minWidth: 0 }}>
                      {it.name} <span className="muted">×{it.qty}</span>
                    </span>
                    <span className="price" style={{ fontSize: 13.5 }}>
                      {formatPrice(it.price * it.qty, locale)}
                    </span>
                  </div>
                ))}
                <div className="divider" />
                {order.delivery_fee > 0 && (
                  <div className="sf-row sf-between" style={{ fontSize: 13.5 }}>
                    <span className="muted">{t.deliveryFee}</span>
                    <span className="price" style={{ fontSize: 13.5 }}>{formatPrice(order.delivery_fee, locale)}</span>
                  </div>
                )}
                <div className="sf-row sf-between">
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{t.total}</span>
                  <span className="price" style={{ fontSize: 16 }}>{formatPrice(order.total, locale)}</span>
                </div>
              </div>
            </div>
          )}

          {!order && !errorMsg && (
            <div className="sf-stack" style={{ alignItems: "center", gap: 8, paddingBlock: 12, color: "var(--z400)" }}>
              <PackageSearch className="size-8" />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
