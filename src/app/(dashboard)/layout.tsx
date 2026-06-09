import { redirect } from "next/navigation";
import { getSellerContext } from "@/lib/auth";
import { TopBar } from "@/components/dashboard/TopBar";
import { BottomNav } from "@/components/dashboard/BottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authenticated (middleware) but no shop yet → finish onboarding first.
  const ctx = await getSellerContext();
  if (!ctx) redirect("/onboarding");

  // The seller dashboard always uses the light "cream" surface for legibility.
  // The shop's chosen theme applies to the public storefront (what buyers see),
  // not the admin — so picking a dark theme (Noir) never makes the dashboard
  // unreadable.
  return (
    <div className="theme-mahalli sf">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col">
        <TopBar shopName={ctx.seller.name} slug={ctx.seller.slug} />
        <main className="flex-1" style={{ padding: "10px 0 110px" }}>
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
