/** Supported locales. Arabic is the default and primary language (spec §8). */
export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

/** Cookie that persists the visitor's language choice. */
export const LOCALE_COOKIE = "mahalli_locale";

/** Text direction per locale. Arabic is RTL. */
export function dir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "ar" || value === "en";
}
