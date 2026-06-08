"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { Input } from "@/components/ui/Input";

export type VariantRow = {
  label: string;
  sku: string;
  price_override: string; // kept as string in the form; parsed on serialize
  stock: string;
};

const empty = (): VariantRow => ({ label: "", sku: "", price_override: "", stock: "0" });

export function VariantsEditor({ initial }: { initial: VariantRow[] }) {
  const { dict } = useI18n();
  const t = dict.products;
  const [rows, setRows] = useState<VariantRow[]>(initial);

  function update(i: number, patch: Partial<VariantRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  // Serialize to the shape save_product expects.
  const serialized = JSON.stringify(
    rows.map((r) => ({
      label: r.label,
      sku: r.sku,
      price_override: r.price_override === "" ? null : Number(r.price_override),
      stock: r.stock === "" ? 0 : Number(r.stock),
    })),
  );

  return (
    <div className="space-y-2">
      <div>
        <span className="text-sm font-medium text-zinc-700">{t.variants}</span>
        <p className="text-xs text-zinc-500">{t.variantsHint}</p>
      </div>

      <input type="hidden" name="variants" value={serialized} />

      <div className="space-y-3">
        {rows.map((row, i) => (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-zinc-200 p-3"
          >
            <div className="flex items-center gap-2">
              <Input
                aria-label={t.variantLabel}
                placeholder={t.variantLabelPlaceholder}
                value={row.label}
                maxLength={120}
                onChange={(e) => update(i, { label: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setRows((p) => p.filter((_, idx) => idx !== i))}
                aria-label={t.removeVariant}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input
                aria-label={t.variantSku}
                placeholder={t.variantSku}
                dir="ltr"
                value={row.sku}
                maxLength={60}
                onChange={(e) => update(i, { sku: e.target.value })}
              />
              <Input
                aria-label={t.variantPrice}
                placeholder={t.variantPrice}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={row.price_override}
                onChange={(e) => update(i, { price_override: e.target.value })}
              />
              <Input
                aria-label={t.variantStock}
                placeholder={t.variantStock}
                type="number"
                inputMode="numeric"
                min={0}
                value={row.stock}
                onChange={(e) => update(i, { stock: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRows((p) => [...p, empty()])}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
      >
        <Plus className="size-4" /> {t.addVariant}
      </button>
    </div>
  );
}
