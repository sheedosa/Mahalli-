import { getI18n } from "@/i18n";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default async function ProductsPage() {
  const { dict } = await getI18n();
  return (
    <ComingSoon
      title={dict.placeholders.productsTitle}
      body={dict.placeholders.productsBody}
      badge={dict.common.comingSoon}
    />
  );
}
