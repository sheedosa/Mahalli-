"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Plus, Search, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/provider";
import { formatPrice, cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import {
  ALL_STATUSES,
  statusBadgeClass,
  type OrderStatus,
} from "@/components/orders/status";

export const PAGE_SIZE = 15;

export type OrderRow = {
  id: string;
  status: OrderStatus;
  channel: "storefront" | "manual";
  buyer_name: string | null;
  buyer_phone: string | null;
  total: number;
  created_at: string;
  order_items: { count: number }[];
};

const SELECT =
  "id,status,channel,buyer_name,buyer_phone,total,created_at,order_items(count)";

function timeAgo(iso: string, locale: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-LY" : "en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function OrdersList({
  initial,
  initialHasMore,
}: {
  initial: OrderRow[];
  initialHasMore: boolean;
}) {
  const { dict, locale } = useI18n();
  const t = dict.orders;

  const [items, setItems] = useState<OrderRow[]>(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function runQuery(
    search: string,
    status: OrderStatus | "all",
    cursor: string | null,
  ) {
    const supabase = createClient();
    let query = supabase
      .from("orders")
      .select(SELECT)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE + 1);
    if (status !== "all") query = query.eq("status", status);
    if (search.trim()) {
      const s = search.trim().replace(/[%,]/g, "");
      query = query.or(`buyer_name.ilike.%${s}%,buyer_phone.ilike.%${s}%`);
    }
    if (cursor) query = query.lt("created_at", cursor);
    const { data } = await query;
    const rows = (data ?? []) as OrderRow[];
    return { rows: rows.slice(0, PAGE_SIZE), more: rows.length > PAGE_SIZE };
  }

  function refresh(search: string, status: OrderStatus | "all") {
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const { rows, more } = await runQuery(search, status, null);
      setItems(rows);
      setHasMore(more);
      setLoading(false);
    }, 300);
  }

  async function loadMore() {
    if (items.length === 0) return;
    setLoading(true);
    const { rows, more } = await runQuery(
      q,
      filter,
      items[items.length - 1].created_at,
    );
    setItems((prev) => [...prev, ...rows]);
    setHasMore(more);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-zinc-900">{t.title}</h1>
        <Link
          href="/orders/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white"
        >
          <Plus className="size-4" /> {t.newManual}
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-zinc-400" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            refresh(e.target.value, filter);
          }}
          placeholder={t.searchPlaceholder}
          className="ps-9"
          aria-label={t.searchPlaceholder}
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(["all", ...ALL_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setFilter(s);
              refresh(q, s);
            }}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm",
              filter === s
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600",
            )}
          >
            {s === "all" ? t.filterAll : t.status[s]}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
          <ShoppingBag className="mx-auto size-8 text-zinc-300" />
          <p className="mt-2 font-medium text-zinc-900">
            {q || filter !== "all" ? t.noResults : t.empty}
          </p>
          {!q && filter === "all" && (
            <p className="mt-1 text-sm text-zinc-500">{t.emptyBody}</p>
          )}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className="block rounded-2xl border border-zinc-200 bg-white p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-zinc-900">
                    {o.buyer_name || o.buyer_phone || t.buyer}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      statusBadgeClass(o.status),
                    )}
                  >
                    {t.status[o.status]}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm text-zinc-500">
                  <span>{timeAgo(o.created_at, locale)}</span>
                  <span className="font-medium text-zinc-700">
                    {formatPrice(Number(o.total), locale)}
                  </span>
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

export { SELECT as ORDER_SELECT };
