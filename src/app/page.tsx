import Link from "next/link";
import { getI18n } from "@/i18n";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Wordmark } from "@/components/brand/Wordmark";

export default async function LandingPage() {
  const { dict } = await getI18n();

  return (
    <main className="theme-mahalli sf">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col" style={{ padding: "18px 20px 28px" }}>
        <header className="sf-row sf-between">
          <Wordmark />
          <LocaleSwitcher />
        </header>

        {/* hero */}
        <div
          style={{ marginTop: 18, borderRadius: 30, background: "var(--hero-grad)", padding: "30px 24px", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-md)" }}
        >
          <div style={{ position: "absolute", insetInlineEnd: -30, insetBlockStart: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.12)" }} />
          <div style={{ position: "absolute", insetInlineStart: -40, insetBlockEnd: -50, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
          <h1 style={{ position: "relative", margin: 0, color: "var(--hero-ink)", fontSize: 30, fontWeight: 800, lineHeight: 1.18, letterSpacing: "-.02em" }}>
            {dict.landing.headline}
          </h1>
          <p style={{ position: "relative", margin: "14px 0 0", color: "rgba(255,255,255,.85)", fontSize: 15, lineHeight: 1.65 }}>
            {dict.landing.sub}
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-end" style={{ gap: 12, paddingBottom: 8 }}>
          <Link href="/signup" className="btn btn-accent btn-pill">{dict.landing.getStarted}</Link>
          <Link href="/login" className="btn btn-outline btn-pill">{dict.landing.signIn}</Link>
        </div>

        <footer className="muted" style={{ textAlign: "center", fontSize: 12, marginTop: 12 }}>
          {dict.meta.appName} · {dict.meta.tagline}
        </footer>
      </div>
    </main>
  );
}
