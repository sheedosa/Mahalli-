import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageCircle, Phone } from "lucide-react";
import { getI18n } from "@/i18n";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { waMeLink } from "@/lib/messaging/walink";
import { Card } from "@/components/ui/Card";
import { statusBadgeClass, type OrderStatus } from "@/components/orders/status";
import { OrderStatusActions } from "@/components/orders/OrderStatusActions";
import { OrderNote } from "@/components/orders/OrderNote";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { dict, locale } = await getI18n();
  const t = dict.orders;

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound(); // RLS hides other tenants' orders → 404

  const status = order.status as OrderStatus;
  const ref = order.id.slice(0, 8).toUpperCase();
  const placed = new Intl.DateTimeFormat(locale === "ar" ? "ar-LY" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(order.created_at));

  return (
    <div className="space-y-4 px-4">
      <div className="flex items-center gap-2">
        <Link
          href="/orders"
          aria-label={dict.common.back}
          className="flex size-10 items-center justify-center rounded-lg hover:bg-[var(--z100)]"
          style={{ color: "var(--z500)" }}
        >
          <ChevronLeft className="size-5 flip-x" />
        </Link>
        <h1 className="flex-1 text-lg font-bold">
          {t.order} #{ref}
        </h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(status)}`}
        >
          {t.status[status]}
        </span>
      </div>

      <p className="muted text-sm">
        {placed} · {t.channel[order.channel]}
      </p>

      {/* Buyer */}
      <Card className="space-y-1">
        <p className="font-medium">
          {order.buyer_name || dict.customers.unnamed}
        </p>
        {order.buyer_phone && (
          <a
            href={`tel:${order.buyer_phone}`}
            dir="ltr"
            className="muted inline-flex items-center gap-1.5 text-sm"
          >
            <Phone className="size-3.5" /> {order.buyer_phone}
          </a>
        )}
        {order.buyer_area && <p className="muted text-sm">{order.buyer_area}</p>}
        {order.buyer_phone && (
          <a
            href={waMeLink(order.buyer_phone, t.waPrefill.replace("{ref}", `#${ref}`))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white"
          >
            <MessageCircle className="size-4" /> {t.messageOnWhatsApp}
          </a>
        )}
      </Card>

      {/* Items */}
      <Card className="space-y-3">
        <p className="text-sm font-semibold">{t.items}</p>
        <ul className="space-y-2">
          {order.order_items.map((it) => (
            <li key={it.id} className="flex items-start justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1">
                <span>{it.name_snapshot}</span>
                <span className="muted"> × {it.qty}</span>
              </span>
              <span className="shrink-0">
                {formatPrice(Number(it.price_snapshot) * it.qty, locale)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t pt-3 text-sm" style={{ borderColor: "var(--line)" }}>
          <div className="muted flex justify-between">
            <dt>{t.subtotal}</dt>
            <dd>{formatPrice(Number(order.subtotal), locale)}</dd>
          </div>
          {Number(order.delivery_fee) > 0 && (
            <div className="muted flex justify-between">
              <dt>{t.deliveryFee}</dt>
              <dd>{formatPrice(Number(order.delivery_fee), locale)}</dd>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-semibold">
            <dt>{t.total}</dt>
            <dd>{formatPrice(Number(order.total), locale)}</dd>
          </div>
        </dl>
      </Card>

      <OrderStatusActions orderId={order.id} status={status} />

      <Card>
        <OrderNote orderId={order.id} initial={order.notes ?? ""} />
      </Card>
    </div>
  );
}
