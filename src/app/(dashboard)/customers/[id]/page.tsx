import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Phone } from "lucide-react";
import { getI18n } from "@/i18n";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { Card, StatCard } from "@/components/ui/Card";
import { statusBadgeClass, type OrderStatus } from "@/components/orders/status";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { dict, locale } = await getI18n();

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!customer) notFound();

  const { data: orders } = await supabase
    .from("orders")
    .select("id,status,total,created_at")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const tc = dict.customers;
  const to = dict.orders;

  return (
    <div className="space-y-4 px-4">
      <div className="flex items-center gap-2">
        <Link
          href="/customers"
          aria-label={dict.common.back}
          className="flex size-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
        >
          <ChevronLeft className="size-5 flip-x" />
        </Link>
        <h1 className="text-xl font-bold text-zinc-900">
          {customer.name || tc.unnamed}
        </h1>
      </div>

      {customer.phone && (
        <a
          href={`tel:${customer.phone}`}
          dir="ltr"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-600"
        >
          <Phone className="size-3.5" /> {customer.phone}
        </a>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={tc.spent}
          value={formatPrice(Number(customer.total_spent), locale)}
        />
        <StatCard
          label={to.title}
          value={String(customer.order_count)}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-zinc-900">{tc.theirOrders}</p>
        {(orders ?? []).length === 0 ? (
          <Card className="text-sm text-zinc-500">{to.empty}</Card>
        ) : (
          <ul className="space-y-2">
            {(orders ?? []).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white p-3"
                >
                  <span className="text-sm text-zinc-600">
                    {new Intl.DateTimeFormat(
                      locale === "ar" ? "ar-LY" : "en-GB",
                      { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
                    ).format(new Date(o.created_at))}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-700">
                      {formatPrice(Number(o.total), locale)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                        o.status as OrderStatus,
                      )}`}
                    >
                      {to.status[o.status as OrderStatus]}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
