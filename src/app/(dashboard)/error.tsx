"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useI18n } from "@/i18n/provider";

/** Dashboard-scoped error boundary: keeps the shell, offers a retry. */
export default function DashboardError({
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
    <div className="anim-in sf-stack" style={{ alignItems: "center", textAlign: "center", gap: 14, padding: "64px 24px" }}>
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
  );
}
