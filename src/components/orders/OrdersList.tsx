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
import {
  PAGE_SIZE,
  ORDER_SELECT,
  type OrderRow,
} from "@/components/orders/query";
import { ListSkeleton } from "@/components/ui/Skeleton";

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
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function runQuery(
    search: string,
    status: OrderStatus | "all",
    cursor: string | null,
  ) {
    const supabase = createClient();
    let query = supabase
      .from("orders")
      .select(ORDER_SELECT)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE + 1);
    if (status !== "all") query = query.eq("status", status);
    if (search.trim()) {
      const s = search.trim().replace(/[%,]/g, "");
      // An order-ref search (the #XXXXXXXX shown on orders): hex, led by # or
      // containing a-f, so pure-digit searches still hit phone numbers. Refs
      // match as a uuid prefix range, which uses the primary key index.
      const hex = s.replace(/^#/, "").toLowerCase();
      const looksLikeRef =
        /^[0-9a-f]{4,8}$/.test(hex) && (s.startsWith("#") || /[a-f]/.test(hex));
      if (looksLikeRef) {
        query = query
          .gte("id", `${hex.padEnd(8, "0")}-0000-0000-0000-000000000000`)
          .lte("id", `${hex.padEnd(8, "f")}-ffff-ffff-ffff-ffffffffffff`);
      } else {
        query = query.or(`buyer_name.ilike.%${s}%,buyer_phone.ilike.%${s}%`);
      }
    }
    if (cursor) query = query.lt("created_at", cursor);
    const { data, error: qErr } = await query;
    setError(Boolean(qErr));
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
    <div className="space-y-4 px-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="display text-xl font-bold">{t.title}</h1>
        <Link href="/orders/new" className="btn btn-primary btn-sm">
          <Plus className="size-4" /> {t.newManual}
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4" style={{ color: "var(--z400)" }} />
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
            className={cn("chip", filter === s && "active")}
          >
            {s === "all" ? t.filterAll : t.status[s]}
          </button>
        ))}
      </div>

      {error && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: "var(--z300)" }}>
          <p className="muted text-sm">{dict.common.genericError}</p>
          <button type="button" onClick={() => refresh(q, filter)} className="btn btn-outline mt-3" style={{ width: "auto", paddingInline: 22 }}>
            {dict.common.retry}
          </button>
        </div>
      ) : loading && items.length === 0 ? (
        <ListSkeleton rows={5} height={64} />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: "var(--z300)" }}>
          <ShoppingBag className="mx-auto size-8" style={{ color: "var(--z300)" }} />
          <p className="mt-2 font-medium">
            {q || filter !== "all" ? t.noResults : t.empty}
          </p>
          {!q && filter === "all" && <p className="muted mt-1 text-sm">{t.emptyBody}</p>}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="card block p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">
                    {o.buyer_name || o.buyer_phone || t.buyer}
                  </span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", statusBadgeClass(o.status))}>
                    {t.status[o.status]}
                  </span>
                </div>
                <div className="muted mt-1 flex items-center justify-between text-sm">
                  <span>{timeAgo(o.created_at, locale)}</span>
                  <span className="font-medium" style={{ color: "var(--ink)" }}>
                    {formatPrice(Number(o.total), locale)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hasMore && items.length > 0 && (
        <button type="button" onClick={loadMore} disabled={loading} className="btn btn-outline">
          {loading ? dict.common.loading : t.loadMore}
        </button>
      )}
    </div>
  );
}
