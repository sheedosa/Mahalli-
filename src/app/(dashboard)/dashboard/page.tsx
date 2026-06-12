import Link from "next/link";
import {
  AlertTriangle,
  Box,
  Eye,
  Package,
  Plus,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { getI18n } from "@/i18n";
import { getSellerContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/components/orders/status";
import { GettingStarted } from "@/components/dashboard/GettingStarted";

const LOW_STOCK_THRESHOLD = 3;

const statusPill: Record<OrderStatus, string> = {
  new: "pill-accent",
  confirmed: "pill-accent",
  ready: "pill-warning",
  out: "pill-warning",
  delivered: "pill-success",
  cancelled: "pill-neutral",
};

export default async function OverviewPage() {
  const ctx = await getSellerContext();
  const { dict, locale } = await getI18n();
  if (!ctx) return null;

  const supabase = await createClient();
  const sellerId = ctx.seller.id;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const dayIso = startOfDay.toISOString();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = weekAgo.toISOString();

  const [todayOrders, deliveredToday, toDeliver, lowStock, recent, productsTotal, ordersTotal, failedNotifs] =
    await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("seller_id", sellerId).gte("created_at", dayIso),
      supabase.from("orders").select("total").eq("seller_id", sellerId).eq("status", "delivered").gte("updated_at", dayIso),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("seller_id", sellerId).in("status", ["confirmed", "ready", "out"]),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("seller_id", sellerId).eq("active", true).lte("stock", LOW_STOCK_THRESHOLD),
      supabase.from("orders").select("id,status,total,buyer_name,buyer_phone,created_at").eq("seller_id", sellerId).order("created_at", { ascending: false }).limit(5),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("seller_id", sellerId),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("seller_id", sellerId),
      // surfacing silent notification failures (RLS scopes to this seller)
      supabase.from("message_outbox").select("id", { count: "exact", head: true }).eq("seller_id", sellerId).eq("status", "failed").gte("updated_at", weekAgoIso),
    ]);

  const revenue = (deliveredToday.data ?? []).reduce((s, o) => s + Number(o.total), 0);
  const orders = recent.data ?? [];
  const hasProducts = (productsTotal.count ?? 0) > 0;
  const hasOrders = (ordersTotal.count ?? 0) > 0;
  const td = dict.dashboard;

  const tile = (icon: React.ReactNode, label: string, value: string, tone: string) => (
    <div className="tile" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ width: 36, height: 36, borderRadius: 11, background: tone, color: "var(--accent-deep)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </span>
      <div className="sf-stack" style={{ gap: 2 }}>
        <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.01em" }}>{value}</span>
        <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>
      </div>
    </div>
  );

  return (
    <div className="anim-in" style={{ padding: "12px 18px 0" }}>
      {(failedNotifs.count ?? 0) > 0 && (
        <Link href="/settings" style={{ textDecoration: "none" }}>
          <div
            className="sf-row"
            style={{ gap: 10, background: "var(--warning-soft)", color: "#b45309", padding: "12px 14px", borderRadius: 14, fontSize: 13, fontWeight: 600, marginBottom: 14 }}
          >
            <AlertTriangle className="size-4" style={{ flex: "none" }} />
            {dict.settings.notifyIssue}
          </div>
        </Link>
      )}

      <GettingStarted hasProducts={hasProducts} hasOrders={hasOrders} />

      <div className="sf-grid2" style={{ gap: 12 }}>
        {tile(<Wallet className="size-[19px]" />, td.revenue, formatPrice(revenue, locale), "var(--accent-soft)")}
        {tile(<Box className="size-[19px]" />, td.todayOrders, String(todayOrders.count ?? 0), "var(--success-soft)")}
        {tile(<Truck className="size-[19px]" />, td.toDeliver, String(toDeliver.count ?? 0), "var(--accent-soft)")}
        {tile(<TrendingUp className="size-[19px]" />, td.lowStock, String(lowStock.count ?? 0), "var(--warning-soft)")}
      </div>

      {/* quick actions */}
      <div className="sf-row" style={{ gap: 12, marginTop: 16 }}>
        <Link href="/products/new" className="btn btn-accent btn-pill" style={{ flex: 1 }}>
          <Plus className="size-5" /> {dict.products.add}
        </Link>
        <Link href={`/${ctx.seller.slug}`} target="_blank" className="btn btn-outline btn-pill" style={{ flex: 1 }}>
          <Eye className="size-5" /> {dict.nav.viewStorefront}
        </Link>
      </div>

      {/* recent orders */}
      <div style={{ marginTop: 24 }}>
        <div className="sf-row sf-between" style={{ padding: "0 4px", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{dict.orders.title}</h2>
          <Link href="/orders" style={{ color: "var(--accent-deep)", fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>
            {dict.products.loadMore}
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="empty">
            <div className="empty-art"><Package className="size-9" /></div>
            <div className="sf-stack" style={{ gap: 6 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{td.ordersEmpty}</h3>
              <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, maxWidth: 260 }}>{td.ordersEmptyHint}</p>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: "4px 14px" }}>
            {orders.map((o, i) => {
              const s = o.status as OrderStatus;
              return (
                <Link key={o.id} href={`/orders/${o.id}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                  <div className="sf-row" style={{ gap: 12, padding: "13px 2px" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--z500)", fontWeight: 800, flex: "none" }}>
                      {(o.buyer_name || o.buyer_phone || "?").slice(0, 1)}
                    </div>
                    <div className="sf-stack" style={{ flex: 1, gap: 3, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{o.buyer_name || o.buyer_phone || dict.orders.buyer}</span>
                      <span className={`pill ${statusPill[s]}`} style={{ alignSelf: "flex-start" }}>{dict.orders.status[s]}</span>
                    </div>
                    <span className="price">{formatPrice(Number(o.total), locale)}</span>
                  </div>
                  {i < orders.length - 1 && <div className="divider" style={{ margin: 0 }} />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
