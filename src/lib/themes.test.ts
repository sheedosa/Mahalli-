import { describe, it, expect } from "vitest";
import {
  isThemeId,
  themeClass,
  THEMES,
  THEME_IDS,
  DEFAULT_THEME,
} from "@/lib/themes";

describe("isThemeId", () => {
  it("accepts valid ids", () => {
    expect(isThemeId("cream")).toBe(true);
    expect(isThemeId("noir")).toBe(true);
  });
  it("rejects invalid / null", () => {
    expect(isThemeId("nope")).toBe(false);
    expect(isThemeId(null)).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
  });
});

describe("themeClass", () => {
  it("returns theme-<id> for valid ids", () => {
    expect(themeClass("mono")).toBe("theme-mono");
  });
  it("falls back to the default for invalid/empty", () => {
    expect(themeClass("bogus")).toBe(`theme-${DEFAULT_THEME}`);
    expect(themeClass(null)).toBe("theme-cream");
  });
});

describe("THEMES", () => {
  it("has one entry per THEME_IDS, ids aligned", () => {
    expect(THEMES.map((t) => t.id).sort()).toEqual([...THEME_IDS].sort());
  });
  it("every theme has ar+en name and a swatch", () => {
    for (const t of THEMES) {
      expect(t.name.ar).toBeTruthy();
      expect(t.name.en).toBeTruthy();
      expect(t.swatch).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
