"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Package, ShoppingBag } from "lucide-react";
import type {
  StorefrontProduct,
  StorefrontShop,
  StorefrontVariant,
} from "@/types/storefront";
import { useI18n } from "@/i18n/provider";
import { formatPrice } from "@/lib/utils";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ProductSheet } from "@/components/storefront/ProductSheet";
import { CheckoutView } from "@/components/storefront/CheckoutView";
import {
  availableStock,
  cartCount,
  cartSubtotal,
  lineKey,
  productInStock,
  unitPrice,
  type CartLine,
} from "@/components/storefront/cart";

type View = "catalog" | "checkout" | "done";

export function StorefrontApp({
  shop,
  products,
  slug,
}: {
  shop: StorefrontShop;
  products: StorefrontProduct[];
  slug: string;
}) {
  const { dict, locale } = useI18n();
  const t = dict.storefront;

  const [lines, setLines] = useState<CartLine[]>([]);
  const [view, setView] = useState<View>("catalog");
  const [sheet, setSheet] = useState<StorefrontProduct | null>(null);
  const [ref, setRef] = useState<string | null>(null);

  function addLine(
    product: StorefrontProduct,
    variant: StorefrontVariant | null,
    qty: number,
  ) {
    const key = lineKey(product.id, variant?.id ?? null);
    const max = availableStock(product, variant);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) =>
          l.key === key ? { ...l, qty: Math.min(max, l.qty + qty) } : l,
        );
      }
      return [...prev, { key, product, variant, qty: Math.min(max, qty) }];
    });
    setSheet(null);
  }

  function setQty(key: string, qty: number) {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => {
            if (l.key !== key) return l;
            const max = availableStock(l.product, l.variant);
            return { ...l, qty: Math.min(max, qty) };
          }),
    );
  }

  function onSuccess(orderRef: string) {
    setRef(orderRef);
    setLines([]);
    setView("done");
  }

  // ---- success ----
  if (view === "done") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <CheckCircle2 className="size-14 text-emerald-500" />
        <h1 className="text-xl font-bold text-zinc-900">{t.orderPlacedTitle}</h1>
        <p className="text-sm text-zinc-500">{t.orderPlacedBody}</p>
        {ref && (
          <p dir="ltr" className="rounded-xl bg-zinc-100 px-4 py-2 font-mono text-lg font-semibold">
            #{ref}
          </p>
        )}
        <button
          onClick={() => setView("catalog")}
          className="mt-2 h-11 rounded-xl bg-zinc-900 px-6 font-medium text-white"
        >
          {t.orderAgain}
        </button>
      </main>
    );
  }

  // ---- checkout ----
  if (view === "checkout") {
    return (
      <main className="min-h-dvh">
        <CheckoutView
          slug={slug}
          shop={shop}
          lines={lines}
          onSetQty={setQty}
          onRemove={(key) => setQty(key, 0)}
          onBack={() => setView("catalog")}
          onSuccess={onSuccess}
        />
      </main>
    );
  }

  // ---- catalog ----
  const count = cartCount(lines);
  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-28 pt-4">
      <header className="mb-5 flex items-center gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-zinc-100">
          {shop.logo_url ? (
            <Image src={shop.logo_url} alt={shop.name} fill sizes="48px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-base font-bold text-zinc-400">
              {shop.name.slice(0, 1)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-zinc-900">{shop.name}</h1>
          {shop.city && <p className="text-sm text-zinc-500">{shop.city}</p>}
        </div>
        <LocaleSwitcher />
      </header>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
          <Package className="mx-auto mb-2 size-7 text-zinc-300" />
          {dict.products.emptyTitle}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {products.map((p) => {
            const inStock = productInStock(p);
            return (
              <li key={p.id}>
                <button
                  disabled={!inStock}
                  onClick={() => setSheet(p)}
                  className="w-full text-start"
                >
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100">
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        fill
                        sizes="(max-width: 480px) 50vw, 240px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-zinc-300">
                        <Package className="size-7" />
                      </div>
                    )}
                    {!inStock && (
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs font-medium text-white">
                        {t.outOfStock}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-sm font-medium text-zinc-900">{p.name}</p>
                  <p className="text-sm text-zinc-500">
                    {formatPrice(unitPrice(p, null), locale)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={() => setView("checkout")}
            className="flex h-13 w-full items-center justify-between rounded-2xl bg-zinc-900 px-5 text-white shadow-lg"
          >
            <span className="flex items-center gap-2 font-medium">
              <ShoppingBag className="size-5" />
              {t.viewCart} · {count}
            </span>
            <span className="font-semibold">
              {formatPrice(cartSubtotal(lines), locale)}
            </span>
          </button>
        </div>
      )}

      {sheet && (
        <ProductSheet
          product={sheet}
          onClose={() => setSheet(null)}
          onAdd={(variant, qty) => addLine(sheet, variant, qty)}
        />
      )}

      <p className="mt-8 text-center text-xs text-zinc-400">{t.poweredBy}</p>
    </main>
  );
}
