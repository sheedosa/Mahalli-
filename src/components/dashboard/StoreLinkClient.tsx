"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  Globe,
  QrCode,
  Share2,
  Store,
} from "lucide-react";
import { useI18n } from "@/i18n/provider";

export function StoreLinkClient({ slug, shopName }: { slug: string; shopName: string }) {
  const { dict } = useI18n();
  const t = dict.storeLink;
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  // Full URL based on the actual origin the seller is on.
  const url = typeof window !== "undefined" ? `${window.location.origin}/${slug}` : `/${slug}`;
  const display = url.replace(/^https?:\/\//, "");

  // Real, scannable QR encoding the storefront URL. Rendered as a data: URI,
  // which the CSP img-src already allows. High error-correction so the centered
  // store badge doesn't break scanning.
  useEffect(() => {
    let alive = true;
    // Lazy-import the QR encoder so it's only fetched on this page, not in the
    // main dashboard bundle.
    import("qrcode")
      .then((m) => m.default.toDataURL(url, { errorCorrectionLevel: "H", margin: 1, width: 300 }))
      .then((d) => alive && setQr(d))
      .catch(() => alive && setQr(null));
    return () => {
      alive = false;
    };
  }, [url]);

  // Mark the "share your shop link" getting-started step as done once the seller
  // copies or shares their link (read back on the dashboard).
  function markShared() {
    try {
      localStorage.setItem("mahalli_shared", "1");
    } catch {}
  }

  function copy() {
    navigator.clipboard?.writeText(url).catch(() => {});
    markShared();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const share = (href: string) => {
    markShared();
    window.open(href, "_blank", "noopener");
  };
  const waText = encodeURIComponent(`${shopName} — ${url}`);

  return (
    <div className="anim-in" style={{ padding: "6px 18px 0", display: "flex", flexDirection: "column", gap: 18 }}>
      <p className="muted" style={{ margin: "0 2px", fontSize: 13.5, lineHeight: 1.6 }}>{t.sub}</p>

      {/* gradient URL hero */}
      <div style={{ borderRadius: 22, background: "var(--hero-grad)", padding: 18, position: "relative", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
        <div style={{ position: "absolute", insetInlineEnd: -24, insetBlockStart: -24, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.12)" }} />
        <div className="sf-row sf-between" style={{ position: "relative" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#fff", fontSize: 12.5, fontWeight: 700, background: "rgba(255,255,255,.18)", padding: "5px 11px", borderRadius: 99 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: "#34d399", boxShadow: "0 0 0 3px rgba(52,211,153,.3)" }} />
            {t.live}
          </span>
          <Globe className="size-5" style={{ color: "rgba(255,255,255,.8)" }} />
        </div>
        <div className="sf-stack" style={{ position: "relative", marginTop: 16, gap: 3 }}>
          <span style={{ color: "rgba(255,255,255,.7)", fontSize: 12, fontWeight: 600 }}>{t.urlLabel}</span>
          <span dir="ltr" style={{ color: "#fff", fontSize: 19, fontWeight: 800, letterSpacing: "-.01em", wordBreak: "break-all" }}>{display}</span>
        </div>
        <button onClick={copy} style={{ position: "relative", marginTop: 16, width: "100%", height: 46, borderRadius: 14, border: "none", cursor: "pointer", background: "#fff", color: "#18181b", fontFamily: "inherit", fontWeight: 800, fontSize: 14.5, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
          {copied ? <Check className="size-[18px]" /> : <Copy className="size-[18px]" />}
          {copied ? t.copied : t.copy}
        </button>
      </div>

      {/* QR */}
      <div className="card" style={{ padding: 18, display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ position: "relative", width: 150, height: 150, background: "#fff", borderRadius: 16, padding: 12, boxShadow: "inset 0 0 0 1px var(--line)", flex: "none" }}>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt={t.qrTitle}
              width={126}
              height={126}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          )}
          <div style={{ position: "absolute", top: "50%", insetInlineStart: "50%", transform: "translate(-50%,-50%)", width: 38, height: 38, borderRadius: 11, background: "var(--accent)", color: "var(--accent-ink)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 5px #fff" }}>
            <Store className="size-5" />
          </div>
        </div>
        <div className="sf-stack" style={{ flex: 1, gap: 7 }}>
          <span className="sf-row" style={{ gap: 8, fontWeight: 800, fontSize: 15 }}><QrCode className="size-[18px]" style={{ color: "var(--accent-deep)" }} />{t.qrTitle}</span>
          <span className="muted" style={{ fontSize: 12.5, lineHeight: 1.55 }}>{t.qrSub}</span>
        </div>
      </div>

      {/* share */}
      <div className="card" style={{ padding: 18 }}>
        <span className="sf-row" style={{ gap: 8, fontWeight: 800, fontSize: 15, marginBottom: 14 }}><Share2 className="size-[18px]" style={{ color: "var(--accent-deep)" }} />{t.shareTitle}</span>
        <div className="sf-row" style={{ gap: 14, justifyContent: "space-between" }}>
          <button onClick={() => share(`https://wa.me/?text=${waText}`)} aria-label="WhatsApp" style={{ width: 54, height: 54, borderRadius: "50%", border: "none", cursor: "pointer", background: "#25D366", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}>
            <Share2 className="size-6" />
          </button>
          <button onClick={() => share(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)} aria-label="Facebook" style={{ width: 54, height: 54, borderRadius: "50%", border: "none", cursor: "pointer", background: "#1877F2", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}>
            <Globe className="size-6" />
          </button>
          <button onClick={() => share(`https://t.me/share/url?url=${encodeURIComponent(url)}`)} aria-label="Telegram" style={{ width: 54, height: 54, borderRadius: "50%", border: "none", cursor: "pointer", background: "#229ED9", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}>
            <Share2 className="size-6 flip-x" />
          </button>
          <button onClick={copy} aria-label={t.copy} style={{ width: 54, height: 54, borderRadius: "50%", border: "none", cursor: "pointer", background: "var(--z800)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}>
            <Copy className="size-6" />
          </button>
        </div>
      </div>

      <a href={`/${slug}`} target="_blank" className="btn btn-outline btn-pill">
        <Eye className="size-5" /> {t.preview}
      </a>
    </div>
  );
}
