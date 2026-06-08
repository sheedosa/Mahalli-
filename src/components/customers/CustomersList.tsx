"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/provider";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/Input";

export const PAGE_SIZE = 20;

export type CustomerRow = {
  id: string;
  name: string | null;
  phone: string;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
};

export const CUSTOMER_SELECT = "id,name,phone,order_count,total_spent,last_order_at";

export function CustomersList({
  initial,
  initialHasMore,
}: {
  initial: CustomerRow[];
  initialHasMore: boolean;
}) {
  const { dict, locale } = useI18n();
  const t = dict.customers;

  const [items, setItems] = useState<CustomerRow[]>(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function runQuery(search: string, pageIndex: number) {
    const supabase = createClient();
    let query = supabase
      .from("customers")
      .select(CUSTOMER_SELECT)
      .order("last_order_at", { ascending: false, nullsFirst: false })
      .range(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);
    if (search.trim()) {
      const s = search.trim().replace(/[%,]/g, "");
      query = query.or(`name.ilike.%${s}%,phone.ilike.%${s}%`);
    }
    const { data } = await query;
    const rows = (data ?? []) as CustomerRow[];
    return { rows: rows.slice(0, PAGE_SIZE), more: rows.length > PAGE_SIZE };
  }

  function onSearch(value: string) {
    setQ(value);
    setPage(0);
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const { rows, more } = await runQuery(value, 0);
      setItems(rows);
      setHasMore(more);
      setLoading(false);
    }, 300);
  }

  async function loadMore() {
    const next = page + 1;
    setLoading(true);
    const { rows, more } = await runQuery(q, next);
    setItems((prev) => [...prev, ...rows]);
    setPage(next);
    setHasMore(more);
    setLoading(false);
  }

  return (
    <div className="space-y-4 px-4">
      <h1 className="text-xl font-bold text-zinc-900">{t.title}</h1>

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
          <Users className="mx-auto size-8 text-zinc-300" />
          <p className="mt-2 font-medium text-zinc-900">
            {q ? t.noResults : t.empty}
          </p>
          {!q && <p className="mt-1 text-sm text-zinc-500">{t.emptyBody}</p>}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/customers/${c.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900">
                    {c.name || t.unnamed}
                  </p>
                  <p dir="ltr" className="truncate text-sm text-zinc-500">
                    {c.phone}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p className="text-sm font-medium text-zinc-700">
                    {formatPrice(Number(c.total_spent), locale)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {t.ordersCount.replace("{n}", String(c.order_count))}
                  </p>
                </div>
              </Link>
            </li>
          ))}
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
