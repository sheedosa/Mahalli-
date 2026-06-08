import "server-only";

import { cookies } from "next/headers";
import en from "@/i18n/dictionaries/en";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";

/** The dictionary shape — English is the source of truth; Arabic must match. */
export type Dictionary = typeof en;

// Lazy-loaded so only the active locale's strings are sent to the client.
const loaders: Record<Locale, () => Promise<{ default: Dictionary }>> = {
  en: () => import("@/i18n/dictionaries/en"),
  ar: () => import("@/i18n/dictionaries/ar"),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return (await loaders[locale]()).default;
}

/** Resolve the active locale from the cookie (server-side). */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/** Convenience: resolve locale + its dictionary in one call. */
export async function getI18n(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: await getDictionary(locale) };
}
