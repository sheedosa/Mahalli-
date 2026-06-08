import { getI18n } from "@/i18n";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default async function CustomersPage() {
  const { dict } = await getI18n();
  return (
    <ComingSoon
      title={dict.placeholders.customersTitle}
      body={dict.placeholders.customersBody}
      badge={dict.common.comingSoon}
    />
  );
}
