"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useI18n } from "@/i18n/provider";

/** Storefront-scoped error boundary: neutral look, lets the buyer retry. */
export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { dict } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="theme-cream sf">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center text-center" style={{ padding: 24, gap: 14 }}>
        <div
          className="sf-row"
          style={{ width: 64, height: 64, borderRadius: 20, background: "var(--warning-soft)", color: "#b45309", justifyContent: "center" }}
        >
          <AlertTriangle className="size-7" />
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, maxWidth: 300 }}>
          {dict.common.genericError}
        </p>
        <button onClick={reset} className="btn btn-outline btn-pill" style={{ width: "auto", paddingInline: 24, height: 46 }}>
          <RotateCcw className="size-4" /> {dict.common.retry}
        </button>
      </div>
    </main>
  );
}
