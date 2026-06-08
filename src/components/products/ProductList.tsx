"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/provider";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/Input";

export const PAGE_SIZE = 12;
const LOW_STOCK = 3;

export type ProductRow = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  active: boolean;
  stock: number;
  category: string | null;
  created_at: string;
  product_variants: { stock: number }[];
};

export const PRODUCT_SELECT =
  "id,name,price,image_url,active,stock,category,created_at,product_variants(stock)";

function effectiveStock(p: ProductRow): number {
  return p.product_variants.length > 0
    ? p.product_variants.reduce((s, v) => s + v.stock, 0)
    : p.stock;
}

export function ProductList({
  initial,
  initialHasMore,
}: {
  initial: ProductRow[];
  initialHasMore: boolean;
}) {
  const { dict, locale } = useI18n();
  const t = dict.products;

  const [items, setItems] = useState<ProductRow[]>(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function runQuery(search: string, cursor: string | null) {
    const supabase = createClient();
    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE + 1);
    if (search.trim()) query = query.ilike("name", `%${search.trim()}%`);
    if (cursor) query = query.lt("created_at", cursor);
    const { data } = await query;
    const rows = (data ?? []) as ProductRow[];
    return { rows: rows.slice(0, PAGE_SIZE), more: rows.length > PAGE_SIZE };
  }

  // Debounced search that resets the list.
  function onSearch(value: string) {
    setQ(value);
    setLoading(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      const { rows, more } = await runQuery(value, null);
      setItems(rows);
      setHasMore(more);
      setLoading(false);
    }, 350);
  }

  async function loadMore() {
    if (items.length === 0) return;
    setLoading(true);
    const cursor = items[items.length - 1].created_at;
    const { rows, more } = await runQuery(q, cursor);
    setItems((prev) => [...prev, ...rows]);
    setHasMore(more);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-zinc-900">{t.title}</h1>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white"
        >
          <Plus className="size-4" /> {t.add}
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-zinc-400" />
        <Input
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="ps-9"
          aria-label={t.searchPlaceholder}
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
          <Package className="mx-auto size-8 text-zinc-300" />
          <p className="mt-2 font-medium text-zinc-900">
            {q ? t.noResults : t.emptyTitle}
          </p>
          {!q && <p className="mt-1 text-sm text-zinc-500">{t.emptyBody}</p>}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((p) => {
            const stock = effectiveStock(p);
            const badge = !p.active
              ? { text: t.inactive, cls: "bg-zinc-100 text-zinc-500" }
              : stock <= 0
                ? { text: t.outOfStock, cls: "bg-red-100 text-red-700" }
                : stock <= LOW_STOCK
                  ? { text: t.lowStock, cls: "bg-amber-100 text-amber-700" }
                  : { text: t.inStock, cls: "bg-emerald-100 text-emerald-700" };
            const variantCount = p.product_variants.length;
            return (
              <li key={p.id}>
                <Link
                  href={`/products/${p.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-2.5"
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-zinc-300">
                        <Package className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-zinc-900">{p.name}</p>
                    <p className="text-sm text-zinc-500">
                      {formatPrice(Number(p.price), locale)}
                      {variantCount > 0 &&
                        ` · ${t.variantsCount.replace("{n}", String(variantCount))}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}
                  >
                    {badge.text}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && items.length > 0 && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 disabled:opacity-50"
        >
          {loading ? dict.common.loading : t.loadMore}
        </button>
      )}
    </div>
  );
}
