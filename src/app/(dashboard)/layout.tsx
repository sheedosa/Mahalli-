import { redirect } from "next/navigation";
import { getSellerContext } from "@/lib/auth";
import { themeClass } from "@/lib/themes";
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

  return (
    <div className={`${themeClass(ctx.seller.theme)} sf`}>
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
