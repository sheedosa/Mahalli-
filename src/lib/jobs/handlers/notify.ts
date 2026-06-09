import { createAdminClient } from "@/lib/supabase/admin";
import type { JobHandler } from "@/lib/jobs/handlers";
import { renderNotification, type NotifyType } from "@/lib/messaging/templates";
import { sendMessage } from "@/lib/messaging/send";
import { formatPrice } from "@/lib/utils";

// Renders a buyer notification for an order lifecycle event and records the
// attempt in message_log. Enqueued by the orders_notify trigger (0016).
export const notifyHandler: JobHandler = async (payload, ctx) => {
  const type = payload.type as NotifyType;
  const orderId = payload.order_id as string;
  if (!type || !orderId) throw new Error("notify: missing type/order_id");

  const supabase = createAdminClient();

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, seller_id, buyer_name, buyer_phone, total")
    .eq("id", orderId)
    .single();
  if (orderErr || !order) throw new Error(`notify: order ${orderId} not found`);

  const { data: seller } = await supabase
    .from("sellers")
    .select("name, lang")
    .eq("id", order.seller_id)
    .single();

  const locale = seller?.lang === "en" ? "en" : "ar";
  const { template, body } = renderNotification(type, locale, {
    shopName: seller?.name ?? "",
    buyerName: order.buyer_name,
    orderRef: `#${order.id.slice(0, 8)}`,
    total: formatPrice(Number(order.total), locale),
  });

  const result = order.buyer_phone
    ? await sendMessage({ toPhone: order.buyer_phone, body })
    : { status: "skipped" as const, channel: "wa_link" as const };

  await supabase.from("message_log").insert({
    seller_id: order.seller_id,
    channel: result.channel,
    to_phone: order.buyer_phone,
    template,
    body,
    outbox_id: ctx.id,
    provider_msg_id: "providerMsgId" in result ? result.providerMsgId ?? null : null,
    status: result.status,
    error: "error" in result ? result.error ?? null : null,
  });

  // A real provider failure → throw so the outbox retries with backoff.
  if (result.status === "failed") {
    throw new Error("error" in result ? result.error ?? "notify failed" : "notify failed");
  }
};
