import { getI18n } from "@/i18n";
import { getSellerContext } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const ctx = await getSellerContext();
  const { dict } = await getI18n();
  if (!ctx) return null;

  return (
    <div className="anim-in">
      <div className="topbar" style={{ position: "static", padding: "4px 18px 8px", background: "transparent", backdropFilter: "none", borderBottom: "none" }}>
        <h1 className="topbar-title">{dict.settings.title}</h1>
      </div>
      <SettingsForm
        initial={{
          name: ctx.seller.name,
          city: ctx.seller.city ?? "",
          phone: ctx.seller.contact_phone ?? "",
          lang: ctx.seller.lang,
          slug: ctx.seller.slug,
          theme: ctx.seller.theme,
        }}
      />
    </div>
  );
}
