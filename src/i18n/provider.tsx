"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "@/i18n";
import { dir as dirFor, type Locale } from "@/i18n/config";

type I18nValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  dict: Dictionary;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, dir: dirFor(locale), dict }}>
      {children}
    </I18nContext.Provider>
  );
}

/** Access the active locale, direction and translations in a client component. */
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
