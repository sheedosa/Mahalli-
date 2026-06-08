import { describe, it, expect } from "vitest";
import { dir, isLocale, defaultLocale, locales } from "@/i18n/config";

describe("dir", () => {
  it("Arabic is RTL, English is LTR", () => {
    expect(dir("ar")).toBe("rtl");
    expect(dir("en")).toBe("ltr");
  });
});

describe("isLocale", () => {
  it("accepts supported locales", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("en")).toBe(true);
  });
  it("rejects others / null", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("defaults", () => {
  it("Arabic-first", () => {
    expect(defaultLocale).toBe("ar");
    expect(locales).toContain("ar");
  });
});
