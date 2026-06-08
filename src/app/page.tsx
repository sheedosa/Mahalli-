import Link from "next/link";
import { getI18n } from "@/i18n";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Button } from "@/components/ui/Button";

export default async function LandingPage() {
  const { dict } = await getI18n();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-5">
      <header className="flex items-center justify-between">
        <span className="text-lg font-bold text-zinc-900">
          {dict.meta.appName}
        </span>
        <LocaleSwitcher />
      </header>

      <div className="flex flex-1 flex-col justify-center gap-6 py-12">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold leading-snug text-zinc-900">
            {dict.landing.headline}
          </h1>
          <p className="text-base text-zinc-500">{dict.landing.sub}</p>
        </div>

        <div className="space-y-3">
          <Link href="/signup" className="block">
            <Button size="lg">{dict.landing.getStarted}</Button>
          </Link>
          <Link href="/login" className="block">
            <Button size="lg" variant="secondary">
              {dict.landing.signIn}
            </Button>
          </Link>
        </div>
      </div>

      <footer className="text-center text-xs text-zinc-400">
        {dict.meta.appName} · {dict.meta.tagline}
      </footer>
    </main>
  );
}
