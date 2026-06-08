"use client";

import { useState } from "react";
import { ChevronLeft, Minus, Plus, Trash2 } from "lucide-react";
import { submitOrder } from "@/app/[slug]/actions";
import type { StorefrontShop } from "@/types/storefront";
import { useI18n } from "@/i18n/provider";
import { formatPrice } from "@/lib/utils";
import {
  cartSubtotal,
  unitPrice,
  type CartLine,
} from "@/components/storefront/cart";

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
  const [hp, setHp] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

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
          : errorKey
            ? t.errorGeneric
            : null;

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={onBack}
          aria-label={t.backToShop}
          className="flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
        >
          <ChevronLeft className="size-5 flip-x" />
        </button>
        <h1 className="text-lg font-bold text-zinc-900">{t.cart}</h1>
      </div>

      <ul className="space-y-2">
        {lines.map((l) => {
          const price = unitPrice(l.product, l.variant);
          return (
            <li
              key={l.key}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {l.product.name}
                  {l.variant && (
                    <span className="text-zinc-500"> · {l.variant.label}</span>
                  )}
                </p>
                <p className="text-sm text-zinc-500">{formatPrice(price, locale)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSetQty(l.key, l.qty - 1)}
                  aria-label="-"
                  className="flex size-7 items-center justify-center rounded-full border border-zinc-200"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-5 text-center text-sm font-semibold">{l.qty}</span>
                <button
                  onClick={() => onSetQty(l.key, l.qty + 1)}
                  aria-label="+"
                  className="flex size-7 items-center justify-center rounded-full border border-zinc-200"
                >
                  <Plus className="size-3.5" />
                </button>
                <button
                  onClick={() => onRemove(l.key)}
                  aria-label={t.remove}
                  className="flex size-7 items-center justify-center rounded-full text-red-500"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <form onSubmit={onPlace} className="mt-5 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">{t.yourDetails}</h2>

        {/* Honeypot: hidden from humans, tempting to bots. Must stay empty. */}
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

        <input
          required
          maxLength={120}
          placeholder={t.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-base"
        />
        <input
          required
          type="tel"
          inputMode="tel"
          dir="ltr"
          maxLength={40}
          placeholder={t.phonePlaceholder}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-base"
        />
        {shop.delivery_areas.length > 0 && (
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base"
          >
            <option value="">{t.selectArea}</option>
            {shop.delivery_areas.map((a) => (
              <option key={a.area} value={a.area}>
                {a.area}
                {a.fee > 0 ? ` (+${formatPrice(a.fee, locale)})` : ""}
              </option>
            ))}
          </select>
        )}

        <dl className="space-y-1 rounded-2xl bg-zinc-50 p-3 text-sm">
          <div className="flex justify-between text-zinc-500">
            <dt>{t.subtotal}</dt>
            <dd>{formatPrice(subtotal, locale)}</dd>
          </div>
          {fee > 0 && (
            <div className="flex justify-between text-zinc-500">
              <dt>{t.deliveryFee}</dt>
              <dd>{formatPrice(fee, locale)}</dd>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-semibold text-zinc-900">
            <dt>{t.total}</dt>
            <dd>{formatPrice(total, locale)}</dd>
          </div>
        </dl>

        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

        <button
          type="submit"
          disabled={submitting || lines.length === 0}
          className="h-12 w-full rounded-xl bg-zinc-900 text-base font-semibold text-white disabled:opacity-50"
        >
          {submitting ? t.placing : t.placeOrder}
        </button>
      </form>
    </div>
  );
}
