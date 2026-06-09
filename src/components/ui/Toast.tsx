"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Check, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; msg: string };

type ToastApi = {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** Lightweight global toast — non-blocking, auto-dismissing, max 3, RTL-safe. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const push = useCallback((kind: ToastKind, msg: string) => {
    const id = ++seq.current;
    setToasts((prev) => [...prev.slice(-2), { id, kind, msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push],
  );

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toasts.length > 0 && (
        <div className="toastwrap" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast pop-in toast-${t.kind}`}>
              {t.kind === "success" ? (
                <Check className="size-[18px]" style={{ flex: "none" }} />
              ) : t.kind === "error" ? (
                <X className="size-[18px]" style={{ flex: "none" }} />
              ) : (
                <Info className="size-[18px]" style={{ flex: "none" }} />
              )}
              <span style={{ flex: 1, minWidth: 0 }}>{t.msg}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="dismiss"
                style={{ background: "none", border: "none", color: "inherit", opacity: 0.7, cursor: "pointer", flex: "none" }}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

/** Returns the toast API. No-ops safely if no provider is mounted. */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? noop;
}

const noop: ToastApi = { success: () => {}, error: () => {}, info: () => {} };
