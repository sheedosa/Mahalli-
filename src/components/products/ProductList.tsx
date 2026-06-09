"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Pencil, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/provider";
import { formatPrice } from "@/lib/utils";
import { PAGE_SIZE, PRODUCT_SELECT, type ProductRow } from "@/components/products/query";

const LOW_STOCK = 3;

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
    const { rows, more } = await runQuery(q, items[items.length - 1].created_at);
    setItems((prev) => [...prev, ...rows]);
    setHasMore(more);
    setLoading(false);
  }

  function stockPill(p: ProductRow) {
    const s = effectiveStock(p);
    if (!p.active) return { cls: "pill-neutral", text: t.inactive };
    if (s <= 0) return { cls: "pill-danger", text: t.outOfStock };
    if (s <= LOW_STOCK) return { cls: "pill-warning", text: `${t.lowStock} · ${s}` };
    return { cls: "pill-success", text: `${t.inStock} · ${s}` };
  }

  return (
    <>
      <div className="anim-in">
      <div className="topbar" style={{ position: "static", padding: "4px 18px 8px", background: "transparent", backdropFilter: "none", borderBottom: "none" }}>
        <h1 className="topbar-title" style={{ flex: 1 }}>{t.title}</h1>
        <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>{items.length}</span>
      </div>

      <div style={{ padding: "0 18px 8px" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", insetInlineStart: 15, top: "50%", transform: "translateY(-50%)", color: "var(--z400)" }}>
            <Search className="size-[18px]" />
          </span>
          <input
            className="input"
            style={{ paddingInlineStart: 44, height: 46, borderRadius: 999 }}
            placeholder={t.searchPlaceholder}
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            aria-label={t.searchPlaceholder}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-art"><Package className="size-9" /></div>
          <div className="sf-stack" style={{ gap: 6 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
              {q ? t.noResults : t.emptyTitle}
            </h3>
            {!q && <p className="muted" style={{ margin: 0, fontSize: 14, maxWidth: 260, lineHeight: 1.6 }}>{t.emptyBody}</p>}
          </div>
        </div>
      ) : (
        <div className="sf-stack" style={{ gap: 11, padding: "6px 18px" }}>
          {items.map((p) => {
            const sp = stockPill(p);
            return (
              <div key={p.id} className="card" style={{ padding: 11, display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 66, height: 80, borderRadius: 14, overflow: "hidden", flex: "none", background: "var(--surface-2)", position: "relative" }}>
                  {p.image_url ? (
                    <Image src={p.image_url} alt="" fill sizes="66px" className="object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center" style={{ color: "var(--z400)" }}><Package className="size-5" /></span>
                  )}
                </div>
                <div className="sf-stack" style={{ flex: 1, gap: 6, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                  <span className="price">{formatPrice(Number(p.price), locale)}</span>
                  <span className={`pill ${sp.cls}`} style={{ alignSelf: "flex-start" }}>{sp.text}</span>
                </div>
                <Link href={`/products/${p.id}`} aria-label={dict.common.edit} className="iconbtn" style={{ boxShadow: "none", background: "var(--z100)" }}>
                  <Pencil className="size-[17px]" />
                </Link>
              </div>
            );
          })}
          {hasMore && (
            <button type="button" onClick={loadMore} disabled={loading} className="btn btn-outline btn-pill" style={{ marginTop: 4 }}>
              {loading ? dict.common.loading : t.loadMore}
            </button>
          )}
        </div>
      )}

      </div>

      <Link href="/products/new" className="fab">
        <Plus className="size-5" /> {t.add}
      </Link>
    </>
  );
}
