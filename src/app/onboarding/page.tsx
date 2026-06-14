import { redirect } from "next/navigation";
import { getI18n } from "@/i18n";
import { getSellerContext, getUser } from "@/lib/auth";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ShopForm } from "@/components/onboarding/ShopForm";
import { Wordmark } from "@/components/brand/Wordmark";

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const ctx = await getSellerContext();
  if (ctx) redirect("/dashboard");

  const { dict } = await getI18n();

  return (
    <div className="theme-mahalli sf">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col" style={{ padding: "18px 20px 32px" }}>
        <header className="sf-row sf-between">
          <Wordmark />
          <LocaleSwitcher />
        </header>
        <main className="flex flex-1 flex-col justify-center" style={{ padding: "24px 0" }}>
          <div className="sf-stack" style={{ gap: 6, marginBottom: 22 }}>
            <h1 className="display" style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: "-.025em" }}>
              {dict.onboarding.title}
            </h1>
            <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              {dict.onboarding.subtitle}
            </p>
          </div>
          <ShopForm />
        </main>
      </div>
    </div>
  );
}
