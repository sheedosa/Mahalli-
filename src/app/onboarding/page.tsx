import { redirect } from "next/navigation";
import { getI18n } from "@/i18n";
import { getSellerContext, getUser } from "@/lib/auth";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ShopForm } from "@/components/onboarding/ShopForm";

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  // Already onboarded → straight to the dashboard.
  const ctx = await getSellerContext();
  if (ctx) redirect("/dashboard");

  const { dict } = await getI18n();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-5">
      <header className="flex items-center justify-between">
        <span className="text-lg font-bold text-zinc-900">
          {dict.meta.appName}
        </span>
        <LocaleSwitcher />
      </header>
      <main className="flex flex-1 flex-col justify-center py-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-bold text-zinc-900">
            {dict.onboarding.title}
          </h1>
          <p className="text-sm text-zinc-500">{dict.onboarding.subtitle}</p>
        </div>
        <ShopForm />
      </main>
    </div>
  );
}
