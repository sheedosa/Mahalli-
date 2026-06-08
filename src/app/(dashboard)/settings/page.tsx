import { getI18n } from "@/i18n";
import { getSellerContext } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const ctx = await getSellerContext();
  const { dict } = await getI18n();
  if (!ctx) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-zinc-900">{dict.settings.title}</h1>
      <SettingsForm
        initial={{
          name: ctx.seller.name,
          city: ctx.seller.city ?? "",
          phone: ctx.seller.contact_phone ?? "",
          lang: ctx.seller.lang,
          slug: ctx.seller.slug,
        }}
      />
    </div>
  );
}
