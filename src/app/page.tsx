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
  const revealAt = (i: number) => `reveal${i === 1 ? " reveal-d2" : i >= 2 ? " reveal-d3" : ""}`;

  return (
    <main className="theme-mahalli sf">
      {/* sticky nav (normal flow — never overlaps the hero) */}
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-row">
          <Wordmark size={20} />
          <nav className="lp-nav-links">
            <a href="#why" className="lp-nav-link">{t.whatIsLabel}</a>
            <a href="#how" className="lp-nav-link">{t.how}</a>
            <a href="#faq" className="lp-nav-link">{t.faqTitle}</a>
          </nav>
          <div className="lp-nav-right">
            <LocaleSwitcher />
            <Link href="/login" className="lp-nav-signin">{t.signIn}</Link>
            <Link href="/signup" className="lp-nav-cta">{t.getStarted}</Link>
          </div>
        </div>
      </header>

      {/* hero — light, two columns on desktop */}
      <section className="lp-section lp-hero anim-in">
        <div className="lp-wrap lp-hero-grid">
          <div className="reveal">
            <span className="lp-eyebrow">{t.eyebrow}</span>
            <h1 className="lp-h1">{t.headline}</h1>
            <p className="lp-lead lp-measure" style={{ marginBlockStart: 18 }}>{t.sub}</p>
            <div className="lp-hero-cta">
              <Link href="/signup" className="btn btn-accent btn-pill">{t.getStarted}</Link>
              <Link href="/login" className="btn btn-outline btn-pill">{t.signIn}</Link>
            </div>
            <p className="lp-hero-trust">{heroTrust}</p>
          </div>
          <div className="lp-hero-art reveal reveal-d2">
            <div className="lp-hero-panel">
              <PhoneMock shopName={t.sampleShop} tagline={t.sampleTagline} cta={dict.storefront.shopNow} products={mockProducts} />
            </div>
          </div>
        </div>
      </section>

      {/* why Mahalli */}
      <section id="why" className="lp-section lp-tint">
        <div className="lp-wrap">
          <div className="reveal" style={{ textAlign: "center", maxWidth: 680, marginInline: "auto", marginBlockEnd: "clamp(32px, 5vw, 52px)" }}>
            <h2 className="lp-h2">{t.whatIsLabel}</h2>
            <p className="lp-lead" style={{ marginBlockStart: 16 }}>{t.whatIs}</p>
          </div>
          <div className="lp-cards lp-cards-3">
            {values.map((v, i) => (
              <div key={i} className={`lp-card ${revealAt(i)}`}>
                <span className="lp-card-ic">{v.icon}</span>
                <div className="sf-stack" style={{ gap: 5 }}>
                  <span className="lp-card-title">{v.title}</span>
                  <span className="lp-card-sub">{v.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="lp-section">
        <div className="lp-wrap">
          <div className="reveal" style={{ textAlign: "center", maxWidth: 680, marginInline: "auto", marginBlockEnd: "clamp(32px, 5vw, 52px)" }}>
            <h2 className="lp-h2">{t.how}</h2>
          </div>
          <div className="lp-steps">
            {steps.map((s, i) => (
              <div key={i} className={`lp-step ${revealAt(i)}`}>
                <span className="lp-step-num">{i + 1}</span>
                <div>
                  <div className="lp-step-title">
                    <span style={{ color: "var(--accent-deep)", display: "inline-flex" }}>{s.icon}</span>
                    {s.title}
                  </div>
                  <div className="lp-step-sub">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="lp-section lp-tint">
        <div className="lp-wrap">
          <div className="reveal" style={{ textAlign: "center", maxWidth: 680, marginInline: "auto", marginBlockEnd: "clamp(32px, 5vw, 52px)" }}>
            <h2 className="lp-h2">{t.featuresTitle}</h2>
          </div>
          <div className="lp-cards lp-cards-4">
            {features.map((f, i) => (
              <div key={i} className={`lp-card ${revealAt(i % 2)}`}>
                <span className="lp-card-ic">{f.icon}</span>
                <div className="sf-stack" style={{ gap: 5 }}>
                  <span className="lp-card-title">{f.title}</span>
                  <span className="lp-card-sub">{f.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="lp-section">
        <div className="lp-wrap">
          <div className="reveal" style={{ textAlign: "center", maxWidth: 680, marginInline: "auto", marginBlockEnd: "clamp(28px, 4vw, 40px)" }}>
            <h2 className="lp-h2">{t.faqTitle}</h2>
          </div>
          <div className="lp-faq">
            {faqs.map((f, i) => (
              <details key={i} className={`lp-faq-item ${revealAt(i % 3)}`}>
                <summary>
                  {f.q}
                  <ChevronDown className="lp-faq-chev size-[18px]" />
                </summary>
                <p className="lp-faq-a">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* closing CTA — contained gradient panel */}
      <section className="lp-section-sm">
        <div className="lp-wrap">
          <div className="lp-cta reveal">
            <h2 className="lp-cta-h2">{t.closingTitle}</h2>
            <p className="lp-cta-sub">{t.closingSub}</p>
            <div className="lp-cta-row">
              <Link href="/signup" className="btn btn-onbrand btn-pill">{t.getStarted}</Link>
              <Link href="/login" className="btn btn-onbrand-ghost btn-pill">{t.signIn}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* footer — light */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-grid">
          <div className="sf-stack" style={{ gap: 8 }}>
            <Wordmark size={20} />
            <p style={{ margin: 0, fontSize: 13, color: "var(--z500)" }}>{dict.meta.tagline}</p>
          </div>
          <div className="lp-footer-links">
            <Link href="/login" className="lp-footer-link">{t.signIn}</Link>
            <Link href="/signup" className="lp-footer-link">{t.getStarted}</Link>
          </div>
          <div className="sf-stack" style={{ gap: 10, alignItems: "center" }}>
            <LocaleSwitcher />
            <p style={{ margin: 0, fontSize: 12, color: "var(--z500)" }}>© {year} {dict.meta.appName}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
