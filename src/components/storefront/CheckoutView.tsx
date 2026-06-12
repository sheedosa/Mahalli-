"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, MapPin, Minus, Package, Plus, Trash2 } from "lucide-react";
import { submitOrder } from "@/app/[slug]/actions";
import type { StorefrontShop } from "@/types/storefront";
import { useI18n } from "@/i18n/provider";
import { formatPrice } from "@/lib/utils";
import { cartSubtotal, unitPrice, type CartLine } from "@/components/storefront/cart";

export function CheckoutView({
  slug,
  shop,
  lines,
  onSetQty,
  onRemove,
  onBack,
  onSuccess,
}: {
  slug: string;
  shop: StorefrontShop;
  lines: CartLine[];
  onSetQty: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
  onBack: () => void;
  onSuccess: (ref: string) => void;
}) {
  const { dict, locale } = useI18n();
  const t = dict.storefront;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [hp, setHp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  // Idempotency key, stable for this checkout session: if the response is lost
  // and the buyer retries, the server returns the order it already created.
  const clientKey = useRef<string>(crypto.randomUUID());

  const subtotal = cartSubtotal(lines);
  const fee = area
    ? Number(shop.delivery_areas.find((a) => a.area === area)?.fee ?? 0)
    : 0;
  const total = subtotal + fee;

  async function onPlace(e: React.FormEvent) {
    e.preventDefault();
    setErrorKey(null);
    setSubmitting(true);
    const res = await submitOrder({
      slug,
      name,
      phone,
      area: area || null,
      hp,
      clientKey: clientKey.current,
      items: lines.map((l) => ({
        product_id: l.product.id,
        variant_id: l.variant?.id ?? null,
        qty: l.qty,
      })),
    });
    setSubmitting(false);
    if (res.ok) onSuccess(res.ref);
    else setErrorKey(res.errorKey);
  }

  const errorMsg =
    errorKey === "rate"
      ? t.errorRate
      : errorKey === "phone"
        ? t.errorPhone
        : errorKey === "empty"
          ? t.errorEmpty
          : errorKey === "stock"
            ? t.errorStock
            : errorKey
              ? t.errorGeneric
              : null;

  return (
    <div className="anim-in" style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}>
      <div className="topbar">
        <button onClick={onBack} aria-label={t.backToShop} className="iconbtn">
          <ChevronLeft className="size-5 flip-x" />
        </button>
        <span className="topbar-title" style={{ flex: 1 }}>
          {t.cart}
        </span>
        <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
          {lines.length}
        </span>
      </div>

      <div style={{ padding: "14px 18px" }} className="sf-stack">
        {/* cart rows */}
        <div className="sf-stack" style={{ gap: 12 }}>
          {lines.map((l) => (
            <div
              key={l.key}
              className="card"
              style={{ padding: 11, display: "flex", gap: 12, alignItems: "center" }}
            >
              <div
                className="relative overflow-hidden"
                style={{ width: 70, height: 86, borderRadius: 16, background: "var(--surface-2)", flex: "none" }}
              >
                {l.product.image_url ? (
                  <Image src={l.product.image_url} alt="" fill sizes="70px" className="object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center" style={{ color: "var(--z400)" }}>
                    <Package className="size-5" />
                  </span>
                )}
              </div>
              <div className="sf-stack" style={{ flex: 1, gap: 5, minWidth: 0 }}>
                <div className="sf-row sf-between" style={{ gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.3 }}>
                    {l.product.name}
                    {l.variant && <span className="muted"> · {l.variant.label}</span>}
                  </span>
                  <button
                    onClick={() => onRemove(l.key)}
                    aria-label={t.remove}
                    style={{ background: "none", border: "none", color: "var(--z400)", cursor: "pointer", padding: 2 }}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="sf-row sf-between" style={{ marginTop: 2 }}>
                  <span className="price">{formatPrice(unitPrice(l.product, l.variant), locale)}</span>
                  <div className="stepper">
                    <button className="step-btn" onClick={() => onSetQty(l.key, l.qty - 1)} aria-label="-">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="step-val" style={{ fontSize: 15 }}>{l.qty}</span>
                    <button className="step-btn" onClick={() => onSetQty(l.key, l.qty + 1)} aria-label="+">
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* buyer form */}
        <form onSubmit={onPlace} className="sf-stack" style={{ gap: 13, marginTop: 22 }}>
          <div className="sf-row" style={{ gap: 8, fontWeight: 800, fontSize: 15 }}>
            <MapPin className="size-[18px]" style={{ color: "var(--accent-deep)" }} />
            {t.yourDetails}
          </div>

          {/* honeypot */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            className="hidden"
            aria-hidden="true"
          />

          <div className="field">
            <label className="label">{t.name}</label>
            <input
              className="input"
              required
              maxLength={120}
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">{t.phone}</label>
            <input
              className="input"
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
          {shop.delivery_areas.length > 0 && (
            <div className="field">
              <label className="label">{t.area}</label>
              <select
                className="input"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                <option value="">{t.selectArea}</option>
                {shop.delivery_areas.map((a) => (
                  <option key={a.area} value={a.area}>
                    {a.area}
                    {a.fee > 0 ? ` (+${formatPrice(a.fee, locale)})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="card" style={{ padding: 16, marginTop: 4 }}>
            <div className="sf-stack" style={{ gap: 9 }}>
              <div className="sf-row sf-between">
                <span className="muted" style={{ fontSize: 14 }}>{t.subtotal}</span>
                <span className="price">{formatPrice(subtotal, locale)}</span>
              </div>
              {fee > 0 && (
                <div className="sf-row sf-between">
                  <span className="muted" style={{ fontSize: 14 }}>{t.deliveryFee}</span>
                  <span className="price">{formatPrice(fee, locale)}</span>
                </div>
              )}
              <div className="divider" />
              <div className="sf-row sf-between">
                <span style={{ fontWeight: 800, fontSize: 16 }}>{t.total}</span>
                <span className="price" style={{ fontSize: 18 }}>{formatPrice(total, locale)}</span>
              </div>
            </div>
          </div>

          {errorMsg && <p className="errline" style={{ fontSize: 13 }}>{errorMsg}</p>}

          <button
            type="submit"
            className="btn btn-accent btn-pill"
            disabled={submitting || lines.length === 0}
          >
            {submitting ? t.placing : t.placeOrder}
          </button>
        </form>
      </div>
    </div>
  );
}
