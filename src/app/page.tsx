import Link from "next/link";
import {
  ClipboardList,
  MapPin,
  MessageCircle,
  PackagePlus,
  Share2,
  ShoppingBag,
  Store,
} from "lucide-react";
import { getI18n } from "@/i18n";
import { formatPrice } from "@/lib/utils";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Wordmark } from "@/components/brand/Wordmark";
import { PhoneMock } from "@/components/brand/PhoneMock";

export default async function LandingPage() {
  const { dict, locale } = await getI18n();
  const t = dict.landing;

  const mockProducts = [
    { name: t.mock1, price: formatPrice(250, locale), img: "/brand/mock/abaya.svg" },
    { name: t.mock2, price: formatPrice(140, locale), img: "/brand/mock/dress.svg" },
    { name: t.mock3, price: formatPrice(320, locale), img: "/brand/mock/bag.svg" },
    { name: t.mock4, price: formatPrice(60, locale), img: "/brand/mock/scarf.svg" },
  ];

  const steps = [
    { icon: <PackagePlus className="size-[17px]" />, title: t.step1, sub: t.step1sub },
    { icon: <Share2 className="size-[17px]" />, title: t.step2, sub: t.step2sub },
    { icon: <ShoppingBag className="size-[17px]" />, title: t.step3, sub: t.step3sub },
  ];

  const features = [
    { icon: <Store className="size-5" />, title: t.feat1, sub: t.feat1sub },
    { icon: <ClipboardList className="size-5" />, title: t.feat2, sub: t.feat2sub },
    { icon: <MessageCircle className="size-5" />, title: t.feat3, sub: t.feat3sub },
    { icon: <MapPin className="size-5" />, title: t.feat4, sub: t.feat4sub },
  ];

  const trust = [t.trustFree, t.trustNoCard, t.trustLangs, t.trustCod];

  return (
    <main className="theme-mahalli sf">
      <div className="anim-in mx-auto flex min-h-dvh max-w-md flex-col" style={{ padding: "18px 20px 28px", gap: 28 }}>
        <header className="sf-row sf-between">
          <Wordmark />
          <LocaleSwitcher />
        </header>

        {/* hero unit: hero card + phone peek + explainer + CTA, composed as one block */}
        <section className="sf-stack" style={{ gap: 0 }}>
          <div
            style={{ borderRadius: 30, background: "var(--hero-grad)", padding: "28px 24px 44px", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-md)" }}
          >
            <div style={{ position: "absolute", insetInlineEnd: -30, insetBlockStart: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.12)" }} />
            <div style={{ position: "absolute", insetInlineStart: -40, insetBlockEnd: -50, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
            <span className="hero-eyebrow" style={{ position: "relative" }}>{t.eyebrow}</span>
            <h1 style={{ position: "relative", margin: 0, color: "var(--hero-ink)", fontSize: 30, fontWeight: 800, lineHeight: 1.18, letterSpacing: "-.02em" }}>
              {t.headline}
            </h1>
            <p style={{ position: "relative", margin: "12px 0 0", color: "rgba(255,255,255,.85)", fontSize: 15, lineHeight: 1.6 }}>
              {t.sub}
            </p>
          </div>

          <div className="sf-row" style={{ justifyContent: "center", marginTop: -26, position: "relative", zIndex: 1 }}>
            <PhoneMock shopName={t.sampleShop} tagline={t.sampleTagline} cta={dict.storefront.shopNow} products={mockProducts} />
          </div>

          <Link href="/signup" className="btn btn-accent btn-pill" style={{ marginTop: 22 }}>
            {t.getStarted}
          </Link>
          <p style={{ textAlign: "center", fontSize: 13.5, marginTop: 10 }}>
            <Link href="/login" style={{ fontWeight: 700, color: "var(--accent-deep)" }}>{t.signIn}</Link>
          </p>
        </section>

        {/* what is Mahalli — the definition, given a real home */}
        <section className="card sf-stack" style={{ padding: 18, gap: 6 }}>
          <span className="eyebrow-accent">{t.whatIsLabel}</span>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6 }}>{t.whatIs}</p>
        </section>

        {/* how it works — connected numbered timeline */}
        <section className="sf-stack" style={{ gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-.01em" }}>{t.how}</h2>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={i} className="step">
                <div className="step-rail">
                  <span className="step-num">{i + 1}</span>
                </div>
                <div className="step-body">
                  <span className="step-head">
                    <span className="step-ic">{s.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{s.title}</span>
                  </span>
                  <span className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{s.sub}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* features */}
        <section className="sf-stack" style={{ gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-.01em" }}>{t.featuresTitle}</h2>
          <div className="sf-grid2" style={{ gap: 12 }}>
            {features.map((f, i) => (
              <div key={i} className="card feat-card">
                <span className="feat-ic">{f.icon}</span>
                <div className="sf-stack" style={{ gap: 3 }}>
                  <span style={{ fontWeight: 800, fontSize: 14.5 }}>{f.title}</span>
                  <span className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{f.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* trust */}
        <div className="sf-row" style={{ gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {trust.map((label) => (
            <span key={label} className="pill pill-neutral">{label}</span>
          ))}
        </div>

        {/* closing CTA */}
        <div className="card sf-stack" style={{ padding: 20, gap: 12, alignItems: "center", textAlign: "center" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{t.closingTitle}</h2>
          <p className="muted" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>{t.closingSub}</p>
          <Link href="/signup" className="btn btn-accent btn-pill">{t.getStarted}</Link>
          <Link href="/login" className="btn btn-ghost btn-pill" style={{ height: 44 }}>{t.signIn}</Link>
        </div>

        <footer className="muted" style={{ textAlign: "center", fontSize: 12 }}>
          {dict.meta.appName} · {dict.meta.tagline}
        </footer>
      </div>
    </main>
  );
}
