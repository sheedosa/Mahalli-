import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes, resolving conflicts (last wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a money amount. Libya uses the Libyan Dinar (LYD). We keep the
 * currency configurable per shop later; for now amounts are bare numbers with
 * a locale-aware separator and a "د.ل" / "LYD" suffix decided by the caller.
 */
export function formatPrice(amount: number, locale: string): string {
  const n = new Intl.NumberFormat(locale === "ar" ? "ar-LY" : "en-LY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return locale === "ar" ? `${n} د.ل` : `${n} LYD`;
}
