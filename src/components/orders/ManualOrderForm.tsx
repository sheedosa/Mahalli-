"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { createManualOrder } from "@/app/(dashboard)/orders/actions";
import { useI18n } from "@/i18n/provider";
import { formatPrice } from "@/lib/utils";
import { Input, Textarea, Field } from "@/components/ui/Input";

export type FormProduct = {
  id: string;
  name: string;
  price: number;
  variants: { id: string; label: string; price_override: number | null }[];
};

type Line = {
  key: string;
  product: FormProduct;
  variantId: string | null;
  qty: number;
};

function unit(product: FormProduct, variantId: string | null): number {
  const v = product.variants.find((x) => x.id === variantId);
  return Number(v?.price_override ?? product.price);
}

export function ManualOrderForm({ products }: { products: FormProduct[] }) {
  const { dict, locale } = useI18n();
  const t = dict.manualOrder;

  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [fee, setFee] = useState("0");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return s ? products.filter((p) => p.name.toLowerCase().includes(s)) : products;
  }, [products, search]);

  function addProduct(product: FormProduct) {
    const variantId = product.variants[0]?.id ?? null;
    const key = `${product.id}:${variantId ?? ""}`;
    setLines((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) {
        return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { key, product, variantId, qty: 1 }];
    });
  }

  function changeVariant(oldKey: string, variantId: string) {
    setLines((prev) => {
      const line = prev.find((l) => l.key === oldKey);
      if (!line) return prev;
      const newKey = `${line.product.id}:${variantId}`;
      const rest = prev.filter((l) => l.key !== oldKey);
      const merged = rest.find((l) => l.key === newKey);
      if (merged) {
        return rest.map((l) =>
          l.key === newKey ? { ...l, qty: l.qty + line.qty } : l,
        );
      }
      return [...rest, { ...line, key: newKey, variantId }];
    });
  }

  function setQty(key: string, qty: number) {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, qty } : l)),
    );
  }

  const subtotal = lines.reduce(
    (s, l) => s + unit(l.product, l.variantId) * l.qty,
    0,
  );
  const total = subtotal + (Number(fee) || 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
      setError(true);
      return;
    }
    setError(false);
    setSubmitting(true);
    const res = await createManualOrder({
      name: name || undefined,
      phone: phone || undefined,
      area: area || undefined,
      notes: notes || undefined,
      deliveryFee: Number(fee) || 0,
      items: lines.map((l) => ({
        product_id: l.product.id,
        variant_id: l.variantId,
        qty: l.qty,
      })),
    });
    // On success the action redirects; we only get here on failure.
    if (res && res.ok === false) {
      setError(true);
      setSubmitting(false);
    }
  }

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
        {t.emptyCatalog}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Selected lines */}
      {lines.length > 0 && (
        <div className="space-y-2">
          {lines.map((l) => (
            <div
              key={l.key}
              className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {l.product.name}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {formatPrice(unit(l.product, l.variantId), locale)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty(l.key, l.qty - 1)}
                    aria-label="-"
                    className="flex size-7 items-center justify-center rounded-full border border-zinc-200"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">{l.qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(l.key, l.qty + 1)}
                    aria-label="+"
                    className="flex size-7 items-center justify-center rounded-full border border-zinc-200"
                  >
                    <Plus className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setQty(l.key, 0)}
                    aria-label={dict.common.delete}
                    className="flex size-7 items-center justify-center rounded-full text-red-500"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              {l.product.variants.length > 0 && (
                <select
                  value={l.variantId ?? ""}
                  onChange={(e) => changeVariant(l.key, e.target.value)}
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm"
                >
                  {l.product.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Product picker */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-zinc-900">{t.products}</p>
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.pick}
            className="ps-9"
          />
        </div>
        <ul className="max-h-64 space-y-1.5 overflow-y-auto">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => addProduct(p)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-2.5 text-start"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-zinc-900">
                    {p.name}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {formatPrice(Number(p.price), locale)}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                  <Plus className="size-3.5" /> {t.add}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Buyer */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-900">{t.customer}</p>
        <Field label={t.name} htmlFor="name" optional={dict.common.optional}>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder={t.namePlaceholder} />
        </Field>
        <Field label={t.phone} htmlFor="phone" optional={dict.common.optional}>
          <Input id="phone" type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} placeholder="09xxxxxxxx" />
        </Field>
        <Field label={t.area} htmlFor="area" optional={dict.common.optional}>
          <Input id="area" value={area} onChange={(e) => setArea(e.target.value)} maxLength={120} placeholder={t.areaPlaceholder} />
        </Field>
        <Field label={t.deliveryFee} htmlFor="fee">
          <Input id="fee" type="number" min={0} step="0.01" dir="ltr" value={fee} onChange={(e) => setFee(e.target.value)} />
        </Field>
        <Field label={t.notes} htmlFor="notes" optional={dict.common.optional}>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} placeholder={t.notesPlaceholder} />
        </Field>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 text-base font-semibold text-zinc-900">
        <span>{dict.orders.total}</span>
        <span>{formatPrice(total, locale)}</span>
      </div>

      {error && <p className="text-sm text-red-600">{lines.length === 0 ? t.noItems : t.error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="h-12 w-full rounded-xl bg-zinc-900 text-base font-semibold text-white disabled:opacity-50"
      >
        {submitting ? t.creating : t.create}
      </button>
    </form>
  );
}
