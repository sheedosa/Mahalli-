import Link from "next/link";
import { getI18n } from "@/i18n";
import { getSellerContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { StatCard, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const LOW_STOCK_THRESHOLD = 3;

export default async function OverviewPage() {
  const ctx = await getSellerContext();
  const { dict, locale } = await getI18n();
  if (!ctx) return null; // layout already redirects

  const supabase = await createClient();
  const sellerId = ctx.seller.id;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const dayIso = startOfDay.toISOString();

  // All RLS-scoped; seller_id filter also drives the composite indexes.
  const [todayOrders, deliveredToday, toDeliver, lowStock, products] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerId)
        .gte("created_at", dayIso),
      supabase
        .from("orders")
        .select("total")
        .eq("seller_id", sellerId)
        .eq("status", "delivered")
        .gte("updated_at", dayIso),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerId)
        .in("status", ["confirmed", "ready", "out"]),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerId)
        .eq("active", true)
        .lte("stock", LOW_STOCK_THRESHOLD),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerId),
    ]);

  const revenue = (deliveredToday.data ?? []).reduce(
    (sum, o) => sum + Number(o.total),
    0,
  );
  const isEmpty = (products.count ?? 0) === 0;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-zinc-500">{dict.dashboard.greeting}</p>
        <h1 className="text-xl font-bold text-zinc-900">{ctx.seller.name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={dict.dashboard.todayOrders}
          value={String(todayOrders.count ?? 0)}
        />
        <StatCard
          label={dict.dashboard.revenue}
          value={formatPrice(revenue, locale)}
        />
        <StatCard
          label={dict.dashboard.toDeliver}
          value={String(toDeliver.count ?? 0)}
        />
        <StatCard
          label={dict.dashboard.lowStock}
          value={String(lowStock.count ?? 0)}
          accent={(lowStock.count ?? 0) > 0 ? "text-amber-600" : undefined}
        />
      </div>

      {isEmpty && (
        <Card className="space-y-3 text-center">
          <h2 className="font-semibold text-zinc-900">
            {dict.dashboard.emptyTitle}
          </h2>
          <p className="text-sm text-zinc-500">{dict.dashboard.emptyBody}</p>
          <Link href="/products" className="block">
            <Button>{dict.dashboard.addProducts}</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
