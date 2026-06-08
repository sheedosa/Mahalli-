"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Toggles between Arabic and English. Persists the choice in a cookie and
 * refreshes so the server layout re-renders with the new lang/dir.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLocale(next: Locale) {
    if (next === locale) return;
    // 1 year, lax — a language preference is not sensitive.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-zinc-200 p-0.5 text-sm",
        pending && "opacity-60",
        className,
      )}
      role="group"
      aria-label={dict.lang.label}
    >
      <Languages className="mx-1 size-4 text-zinc-400" aria-hidden />
      <button
        type="button"
        onClick={() => setLocale("ar")}
        aria-pressed={locale === "ar"}
        className={cn(
          "rounded-full px-2.5 py-1 transition",
          locale === "ar" ? "bg-zinc-900 text-white" : "text-zinc-600",
        )}
      >
        {dict.lang.ar}
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={cn(
          "rounded-full px-2.5 py-1 transition",
          locale === "en" ? "bg-zinc-900 text-white" : "text-zinc-600",
        )}
      >
        {dict.lang.en}
      </button>
    </div>
  );
}
