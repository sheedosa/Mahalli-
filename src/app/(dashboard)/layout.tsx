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

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar shopName={ctx.seller.name} />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
