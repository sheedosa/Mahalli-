import Link from "next/link";
import {
  BadgeCheck,
  Banknote,
  ChevronDown,
  ClipboardList,
  MapPin,
  MessageCircle,
  PackagePlus,
  Share2,
  ShoppingBag,
  Smartphone,
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

  const values = [
    { icon: <BadgeCheck className="size-5" />, title: t.val1, sub: t.val1sub },
    { icon: <Smartphone className="size-5" />, title: t.val2, sub: t.val2sub },
    { icon: <Banknote className="size-5" />, title: t.val3, sub: t.val3sub },
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

  const faqs = [
    { q: t.faq1q, a: t.faq1a },
    { q: t.faq2q, a: t.faq2a },
    { q: t.faq3q, a: t.faq3a },
    { q: t.faq4q, a: t.faq4a },
  ];

  const heroTrust = `${t.trustFree} · ${t.trustNoCard} · ${t.trustLangs}`;
  const year = new Date().getFullYear();

  return (
    <main className="theme-mahalli sf anim-in">
      {/* sticky nav */}
      <header className="lp-nav">
        <div className="lp-inner lp-nav-row">
          <Wordmark size={20} />
          <div className="sf-row" style={{ gap: 10 }}>
            <LocaleSwitcher />
            <Link href="/signup" className="lp-nav-cta max-[400px]:hidden">{t.getStarted}</Link>
          </div>
        </div>
      </header>

      {/* hero band */}
      <section className="lp-hero">
        <div style={{ position: "absolute", insetInlineEnd: -36, insetBlockStart: -36, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,.12)" }} />
        <div style={{ position: "absolute", insetInlineStart: -48, insetBlockEnd: -60, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
        <div className="lp-inner" style={{ position: "relative" }}>
          <span className="hero-eyebrow">{t.eyebrow}</span>
          <h1 className="lp-hero-h1">{t.headline}</h1>
          <p className="lp-hero-sub">{t.sub}</p>
          <div className="lp-hero-cta">
            <Link href="/signup" className="btn btn-hero btn-pill">{t.getStarted}</Link>
            <Link href="/login" className="btn btn-hero-ghost btn-pill">{t.signIn}</Link>
          </div>
          <p className="lp-hero-trust">{heroTrust}</p>
        </div>
      </section>

      {/* phone mock — overlaps the hero bottom into the surface below */}
      <div className="lp-inner sf-row" style={{ justifyContent: "center", marginBlockStart: -44, position: "relative", zIndex: 2 }}>
        <PhoneMock shopName={t.sampleShop} tagline={t.sampleTagline} cta={dict.storefront.shopNow} products={mockProducts} />
      </div>

      {/* why Mahalli — definition + value strip */}
      <section className="lp-band">
        <div className="lp-inner sf-stack" style={{ gap: 20 }}>
          <div className="sf-stack" style={{ gap: 7 }}>
            <span className="eyebrow-accent">{t.whatIsLabel}</span>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>{t.whatIs}</p>
          </div>
          <div className="lp-values">
            {values.map((v, i) => (
              <div key={i} className="val">
                <span className="val-ic">{v.icon}</span>
                <div className="sf-stack" style={{ gap: 2, minWidth: 0 }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{v.title}</span>
                  <span className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{v.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works — tinted band, connected numbered timeline */}
      <section className="lp-band lp-band-tint">
        <div className="lp-inner sf-stack" style={{ gap: 16 }}>
          <h2 className="lp-h2">{t.how}</h2>
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
        </div>
      </section>

      {/* features */}
      <section className="lp-band">
        <div className="lp-inner sf-stack" style={{ gap: 16 }}>
          <h2 className="lp-h2">{t.featuresTitle}</h2>
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
        </div>
      </section>

      {/* FAQ — tinted band, native disclosures */}
      <section className="lp-band lp-band-tint">
        <div className="lp-inner sf-stack" style={{ gap: 16 }}>
          <h2 className="lp-h2">{t.faqTitle}</h2>
          <div className="faq">
            {faqs.map((f, i) => (
              <details key={i} className="faq-item">
                <summary>
                  {f.q}
                  <ChevronDown className="faq-chev size-[18px]" />
                </summary>
                <p className="faq-a">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* closing CTA band */}
      <section className="lp-band-cta">
        <div style={{ position: "absolute", insetInlineEnd: -40, insetBlockStart: -40, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,.10)" }} />
        <div className="lp-inner sf-stack" style={{ gap: 13, alignItems: "center", textAlign: "center", position: "relative" }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.01em", color: "#fff" }}>{t.closingTitle}</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,.85)" }}>{t.closingSub}</p>
          <Link href="/signup" className="btn btn-hero btn-pill" style={{ marginBlockStart: 6 }}>{t.getStarted}</Link>
          <Link href="/login" className="btn btn-hero-ghost btn-pill">{t.signIn}</Link>
        </div>
      </section>

      {/* footer */}
      <footer className="lp-footer">
        <div className="lp-inner sf-stack" style={{ gap: 14, alignItems: "center", textAlign: "center" }}>
          <Wordmark size={20} />
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>{dict.meta.tagline}</p>
          <div className="lp-footer-links">
            <Link href="/login" style={{ color: "var(--accent-deep)" }}>{t.signIn}</Link>
            <Link href="/signup" style={{ color: "var(--accent-deep)" }}>{t.getStarted}</Link>
          </div>
          <LocaleSwitcher />
          <p className="muted" style={{ margin: 0, fontSize: 11.5 }}>© {year} {dict.meta.appName}</p>
        </div>
      </footer>
    </main>
  );
}
