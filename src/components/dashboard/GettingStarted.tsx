"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Plus, Share2, ShoppingBag, X } from "lucide-react";
import { useI18n } from "@/i18n/provider";

// Tracked client-side so we need no DB column: the share step is marked from the
// store-link page's copy/share handlers; dismissal persists across reloads.
const SHARED_KEY = "mahalli_shared";
const DISMISS_KEY = "mahalli_gs_dismissed";
const FLAG_EVENT = "mahalli-flags";

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setFlag(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {}
  window.dispatchEvent(new Event(FLAG_EVENT));
}

// Read a persisted localStorage flag without a setState-in-effect: the server
// snapshot is `false`, so SSR and first client paint match, then React swaps in
// the real value after hydration (no mismatch).
function useFlag(key: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(FLAG_EVENT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(FLAG_EVENT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    () => readFlag(key),
    () => false,
  );
}

export function GettingStarted({
  hasProducts,
  hasOrders,
}: {
  hasProducts: boolean;
  hasOrders: boolean;
}) {
  const { dict } = useI18n();
  const t = dict.getStarted;

  const shared = useFlag(SHARED_KEY);
  const dismissed = useFlag(DISMISS_KEY);

  if (dismissed) return null;

  const steps = [
    {
      done: hasProducts,
      title: t.step1Title,
      body: t.step1Body,
      cta: t.step1Cta,
      href: "/products/new",
      icon: <Plus className="size-[18px]" />,
    },
    {
      done: shared,
      title: t.step2Title,
      body: t.step2Body,
      cta: t.step2Cta,
      href: "/link",
      icon: <Share2 className="size-[18px]" />,
    },
    {
      done: hasOrders,
      title: t.step3Title,
      body: hasOrders ? t.step3Done : t.step3Body,
      cta: null as string | null,
      href: null as string | null,
      icon: <ShoppingBag className="size-[18px]" />,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  function dismiss() {
    setFlag(DISMISS_KEY);
  }

  if (allDone) {
    return (
      <div className="card anim-in" style={{ padding: 16, marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent-deep)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <Check className="size-5" />
        </span>
        <div className="sf-stack" style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{t.allDone}</span>
          <span className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{t.allDoneBody}</span>
        </div>
        <button type="button" onClick={dismiss} aria-label={t.dismiss} className="iconbtn" style={{ boxShadow: "none", background: "var(--z100)" }}>
          <X className="size-[17px]" />
        </button>
      </div>
    );
  }

  return (
    <div className="card anim-in" style={{ padding: 16, marginBottom: 14 }}>
      <div className="sf-row sf-between" style={{ marginBottom: 12 }}>
        <span style={{ fontWeight: 800, fontSize: 15.5 }}>{t.title}</span>
        <span className="sf-row" style={{ gap: 8 }}>
          <span className="pill pill-accent">
            {t.progress.replace("{done}", String(doneCount)).replace("{total}", String(steps.length))}
          </span>
          <button type="button" onClick={dismiss} aria-label={t.dismiss} className="iconbtn" style={{ boxShadow: "none", background: "var(--z100)", width: 36, height: 36 }}>
            <X className="size-4" />
          </button>
        </span>
      </div>

      <div className="sf-stack" style={{ gap: 10 }}>
        {steps.map((s, i) => (
          <div key={i} className="sf-row" style={{ gap: 12, opacity: s.done ? 0.6 : 1 }}>
            <span
              style={{
                width: 30, height: 30, borderRadius: 999, flex: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: s.done ? "var(--accent)" : "var(--surface-2)",
                color: s.done ? "var(--accent-ink)" : "var(--z500)",
              }}
            >
              {s.done ? <Check className="size-[17px]" /> : s.icon}
            </span>
            <div className="sf-stack" style={{ flex: 1, gap: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 14, textDecoration: s.done ? "line-through" : "none" }}>{s.title}</span>
              <span className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{s.body}</span>
            </div>
            {!s.done && s.cta && s.href && (
              <Link href={s.href} className="btn btn-accent btn-pill" style={{ width: "auto", height: 40, paddingInline: 16, flex: "none", fontSize: 13.5 }}>
                {s.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
