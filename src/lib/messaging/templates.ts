// Outbound buyer-notification message bodies, in the shop's language. These are
// WhatsApp/SMS message texts (not app UI), so they live here rather than in the
// i18n dictionaries. Pure + unit-tested.

export type NotifyType =
  | "order_placed"
  | "order_confirmed"
  | "order_out"
  | "order_delivered";

export type NotifyLocale = "ar" | "en";

export type NotifyData = {
  shopName: string;
  buyerName?: string | null;
  orderRef: string; // e.g. "#1a2b3c4d"
  total: string; // pre-formatted price
};

const TEMPLATES: Record<NotifyLocale, Record<NotifyType, (d: NotifyData) => string>> = {
  en: {
    order_placed: (d) =>
      `Hi ${d.buyerName || "there"}, thanks for ordering from ${d.shopName}! We received your order ${d.orderRef} for ${d.total} and will confirm it shortly.`,
    order_confirmed: (d) =>
      `Good news${d.buyerName ? `, ${d.buyerName}` : ""}! ${d.shopName} confirmed your order ${d.orderRef}. We're getting it ready.`,
    order_out: (d) =>
      `Your order ${d.orderRef} from ${d.shopName} is on its way. See you soon!`,
    order_delivered: (d) =>
      `Your order ${d.orderRef} from ${d.shopName} has been delivered. Thank you for shopping with us! 🤍`,
  },
  ar: {
    order_placed: (d) =>
      `أهلين ${d.buyerName || ""}، شكراً على طلبك من ${d.shopName}! استلمنا طلبك ${d.orderRef} بقيمة ${d.total} وحنأكّدوه قريب.`,
    order_confirmed: (d) =>
      `خبر حلو${d.buyerName ? ` يا ${d.buyerName}` : ""}! ${d.shopName} أكّد طلبك ${d.orderRef} وقاعدين نجهّزوه.`,
    order_out: (d) =>
      `طلبك ${d.orderRef} من ${d.shopName} في الطريق إليك. نشوفك قريب!`,
    order_delivered: (d) =>
      `طلبك ${d.orderRef} من ${d.shopName} توصّل. شكراً على ثقتك فينا! 🤍`,
  },
};

export function renderNotification(
  type: NotifyType,
  locale: NotifyLocale,
  data: NotifyData,
): { template: string; body: string } {
  const byLocale = TEMPLATES[locale] ?? TEMPLATES.ar;
  const body = byLocale[type](data).replace(/\s+/g, " ").trim();
  return { template: type, body };
}
