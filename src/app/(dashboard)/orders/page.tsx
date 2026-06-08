import { getI18n } from "@/i18n";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default async function OrdersPage() {
  const { dict } = await getI18n();
  return (
    <ComingSoon
      title={dict.placeholders.ordersTitle}
      body={dict.placeholders.ordersBody}
      badge={dict.common.comingSoon}
    />
  );
}
