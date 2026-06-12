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

/** Fine film grain over the dark bands (inline SVG = same-origin, no CSP risk). */
function Grain() {
  return (
    <svg className="lp-grain" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <filter id="lpNoise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#lpNoise)" />
    </svg>
  );
}

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
    { icon: <Store className="size-5" />, title: t.feat1, sub: t.feat1sub, wide: true },
    { icon: <ClipboardList className="size-5" />, title: t.feat2, sub: t.feat2sub, wide: false },
    { icon: <MessageCircle className="size-5" />, title: t.feat3, sub: t.feat3sub, wide: false },
    { icon: <MapPin className="size-5" />, title: t.feat4, sub: t.feat4sub, wide: true },
  ];

  const faqs = [
    { q: t.faq1q, a: t.faq1a },
    { q: t.faq2q, a: t.faq2a },
    { q: t.faq3q, a: t.faq3a },
    { q: t.faq4q, a: t.faq4a },
  ];

  const heroTrust = `${t.trustFree} · ${t.trustNoCard} · ${t.trustLangs}`;
  const marqueeItems = [t.trustFree, t.trustNoCard, t.trustLangs, t.trustCod, t.val2, t.feat4];
  const year = new Date().getFullYear();

  const revealAt = (i: number) => `reveal${i === 1 ? " reveal-d2" : i >= 2 ? " reveal-d3" : ""}`;

  return (
    <main className="theme-mahalli sf anim-in">
      {/* floating frosted pill nav */}
      <header className="lp-navwrap">
        <div className="lp-nav">
          <Wordmark size={20} />
          <div className="sf-row" style={{ gap: 8 }}>
            <LocaleSwitcher />
            <Link href="/signup" className="lp-nav-cta max-[400px]:hidden">{t.getStarted}</Link>
          </div>
        </div>
      </header>

      {/* hero — dark aurora band */}
      <section className="lp-dark lp-hero">
        <Grain />
        <span className="lp-blob" aria-hidden style={{ width: 200, height: 200, insetBlockStart: -40, insetInlineEnd: -30, background: "rgba(95,213,146,.40)" }} />
        <span className="lp-blob" aria-hidden style={{ width: 170, height: 170, insetBlockEnd: -60, insetInlineStart: -50, background: "rgba(232,113,74,.22)" }} />
        <div className="lp-inner" style={{ position: "relative" }}>
          <span className="lp-live">
            <span className="lp-live-dot" />
            <span className="hero-eyebrow">{t.eyebrow}</span>
          </span>
          <h1 className="lp-hero-h1">{t.headline}</h1>
          <p className="lp-hero-sub">{t.sub}</p>
          <div className="lp-hero-cta">
            <Link href="/signup" className="btn btn-hero btn-pill btn-sheen">{t.getStarted}</Link>
            <Link href="/login" className="btn btn-hero-ghost btn-pill">{t.signIn}</Link>
          </div>
          <p className="lp-hero-trust">{heroTrust}</p>
        </div>
      </section>

      {/* phone mock — spotlit, floating, overlapping the hero edge */}
      <div className="lp-phone">
        <div className="lp-phone-float">
          <PhoneMock shopName={t.sampleShop} tagline={t.sampleTagline} cta={dict.storefront.shopNow} products={mockProducts} />
        </div>
      </div>

      {/* marquee strip */}
      <section className="lp-band-tint" style={{ paddingBlock: 14 }}>
        <div className="marquee" aria-hidden>
          <div className="marquee-track">
            {[...marqueeItems, ...marqueeItems].map((m, i) => (
              <span key={i} className="marquee-chip"><span className="marquee-dot" />{m}</span>
            ))}
          </div>
        </div>
      </section>

      {/* why Mahalli — definition + value bento */}
      <section className="lp-band">
        <div className="lp-inner lp-sect">
          <span className="lp-ghost" aria-hidden>01</span>
          <div className="sf-stack reveal" style={{ gap: 7, marginBlockEnd: 18 }}>
            <span className="eyebrow-accent">{t.whatIsLabel}</span>
            <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6 }}>{t.whatIs}</p>
          </div>
          <div className="lp-bento">
            {values.map((v, i) => (
              <div key={i} className={`bento-card ${i === 0 ? "bento-wide" : ""} ${revealAt(i)}`}>
                <span className="val-ic">{v.icon}</span>
                <div className="sf-stack" style={{ gap: 3 }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{v.title}</span>
                  <span className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{v.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works — dark band, glowing timeline */}
      <section className="lp-dark lp-band lp-band-dark">
        <Grain />
        <span className="lp-blob" aria-hidden style={{ width: 180, height: 180, insetBlockStart: -50, insetInlineEnd: -40, background: "rgba(47,158,94,.35)" }} />
        <div className="lp-inner lp-sect">
          <span className="lp-ghost" aria-hidden>02</span>
          <h2 className="lp-h2 reveal" style={{ marginBlockEnd: 18 }}>{t.how}</h2>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={i} className={`step ${revealAt(i)}`}>
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

      {/* features — light band, bento grid */}
      <section className="lp-band">
        <div className="lp-inner lp-sect">
          <span className="lp-ghost" aria-hidden>03</span>
          <h2 className="lp-h2 reveal" style={{ marginBlockEnd: 18 }}>{t.featuresTitle}</h2>
          <div className="lp-bento">
            {features.map((f, i) => (
              <div key={i} className={`bento-card ${f.wide ? "bento-wide" : ""} ${revealAt(i % 2)}`}>
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
        <div className="lp-inner lp-sect">
          <span className="lp-ghost" aria-hidden>04</span>
          <h2 className="lp-h2 reveal" style={{ marginBlockEnd: 16 }}>{t.faqTitle}</h2>
          <div className="faq">
            {faqs.map((f, i) => (
              <details key={i} className={`faq-item ${revealAt(i % 3)}`}>
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

      {/* closing CTA — dark aurora band */}
      <section className="lp-dark lp-band-cta">
        <Grain />
        <span className="lp-blob" aria-hidden style={{ width: 200, height: 200, insetBlockStart: -50, insetInlineStart: -40, background: "rgba(95,213,146,.34)" }} />
        <div className="lp-inner sf-stack reveal" style={{ gap: 13, alignItems: "center", textAlign: "center", position: "relative" }}>
          <h2 style={{ margin: 0, fontSize: "clamp(22px, 7vw, 28px)", fontWeight: 900, letterSpacing: "-.02em", color: "#fff" }}>{t.closingTitle}</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,.82)", maxWidth: "32ch" }}>{t.closingSub}</p>
          <Link href="/signup" className="btn btn-hero btn-pill btn-sheen" style={{ marginBlockStart: 6 }}>{t.getStarted}</Link>
          <Link href="/login" className="btn btn-hero-ghost btn-pill">{t.signIn}</Link>
        </div>
      </section>

      {/* footer — dark */}
      <footer className="lp-footer">
        <div className="lp-inner sf-stack" style={{ gap: 14, alignItems: "center", textAlign: "center" }}>
          <Wordmark size={20} />
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,.6)" }}>{dict.meta.tagline}</p>
          <div className="lp-footer-links">
            <Link href="/login" style={{ color: "var(--accent-deep)" }}>{t.signIn}</Link>
            <Link href="/signup" style={{ color: "var(--accent-deep)" }}>{t.getStarted}</Link>
          </div>
          <LocaleSwitcher />
          <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,.45)" }}>© {year} {dict.meta.appName}</p>
        </div>
      </footer>
    </main>
  );
}
