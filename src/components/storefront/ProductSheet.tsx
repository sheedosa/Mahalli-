"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import type { StorefrontProduct, StorefrontVariant } from "@/types/storefront";
import { useI18n } from "@/i18n/provider";
import { formatPrice, cn } from "@/lib/utils";
import { availableStock, unitPrice } from "@/components/storefront/cart";

export function ProductSheet({
  product,
  onClose,
  onAdd,
}: {
  product: StorefrontProduct;
  onClose: () => void;
  onAdd: (variant: StorefrontVariant | null, qty: number) => void;
}) {
  const { dict, locale } = useI18n();
  const t = dict.storefront;
  const hasVariants = product.variants.length > 0;

  const [variant, setVariant] = useState<StorefrontVariant | null>(
    hasVariants ? (product.variants.find((v) => v.stock > 0) ?? product.variants[0]) : null,
  );
  const [qty, setQty] = useState(1);

  const stock = availableStock(product, variant);
  const price = unitPrice(product, variant);
  const canAdd = stock > 0 && (!hasVariants || variant !== null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      <button
        aria-label={dict.common.cancel}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <button
          onClick={onClose}
          aria-label={dict.common.cancel}
          className="absolute end-4 top-4 flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
        >
          <X className="size-4" />
        </button>

        <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-2xl bg-zinc-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 480px) 100vw, 480px"
              className="object-cover"
            />
          ) : null}
        </div>

        <h2 className="text-lg font-bold text-zinc-900">{product.name}</h2>
        <p className="mt-0.5 text-base font-semibold text-zinc-900">
          {formatPrice(price, locale)}
        </p>
        {product.description && (
          <p className="mt-2 text-sm text-zinc-500">{product.description}</p>
        )}

        {hasVariants && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-zinc-700">
              {t.selectOption}
            </p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const out = v.stock <= 0;
                const selected = variant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    disabled={out}
                    onClick={() => {
                      setVariant(v);
                      setQty(1);
                    }}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm",
                      selected
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-700",
                      out && "cursor-not-allowed opacity-40 line-through",
                    )}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700">{t.qty}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="-"
              className="flex size-9 items-center justify-center rounded-full border border-zinc-200"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-6 text-center font-semibold">{qty}</span>
            <button
              onClick={() => setQty((q) => (stock > 0 ? Math.min(stock, q + 1) : q + 1))}
              aria-label="+"
              className="flex size-9 items-center justify-center rounded-full border border-zinc-200"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <button
          disabled={!canAdd}
          onClick={() => onAdd(variant, qty)}
          className="mt-5 h-12 w-full rounded-xl bg-zinc-900 text-base font-semibold text-white disabled:opacity-40"
        >
          {canAdd
            ? `${t.addToCart} · ${formatPrice(price * qty, locale)}`
            : t.outOfStock}
        </button>
      </div>
    </div>
  );
}
