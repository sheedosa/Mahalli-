import { getI18n } from "@/i18n";
import { getSellerContext } from "@/lib/auth";
import { StoreLinkClient } from "@/components/dashboard/StoreLinkClient";

export default async function StoreLinkPage() {
  const ctx = await getSellerContext();
  const { dict } = await getI18n();
  if (!ctx) return null;

  return (
    <div className="anim-in">
      <div className="topbar" style={{ position: "static", padding: "4px 18px 8px", background: "transparent", backdropFilter: "none", borderBottom: "none" }}>
        <h1 className="topbar-title">{dict.storeLink.title}</h1>
      </div>
      <StoreLinkClient slug={ctx.seller.slug} shopName={ctx.seller.name} />
    </div>
  );
}
