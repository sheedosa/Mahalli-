import { describe, it, expect } from "vitest";
import { slugRe, isReservedSlug, isValidSlug, slugify } from "@/lib/slug";

describe("slugRe", () => {
  it("accepts valid slugs", () => {
    for (const s of ["layla-boutique", "shop1", "a1b", "noor-bakery"]) {
      expect(slugRe.test(s)).toBe(true);
    }
  });
  it("rejects invalid slugs", () => {
    for (const s of ["ab", "-lead", "trail-", "Upper", "has space", "x".repeat(41), "bad_underscore"]) {
      expect(slugRe.test(s)).toBe(false);
    }
  });
});

describe("isReservedSlug", () => {
  it("flags reserved names (case-insensitive)", () => {
    expect(isReservedSlug("dashboard")).toBe(true);
    expect(isReservedSlug("LINK")).toBe(true);
    expect(isReservedSlug("api")).toBe(true);
  });
  it("allows normal names", () => {
    expect(isReservedSlug("layla-boutique")).toBe(false);
  });
});

describe("isValidSlug", () => {
  it("requires valid format AND not reserved", () => {
    expect(isValidSlug("layla-boutique")).toBe(true);
    expect(isValidSlug("settings")).toBe(false); // reserved
    expect(isValidSlug("ab")).toBe(false); // too short
  });
});

describe("slugify", () => {
  it("lowercases, strips, dashes spaces", () => {
    expect(slugify("Layla Boutique")).toBe("layla-boutique");
    expect(slugify("  Noor's   Bakery!! ")).toBe("noors-bakery");
  });
  it("returns empty for non-latin (Arabic typed manually)", () => {
    expect(slugify("حلويات نور")).toBe("");
  });
  it("caps at 40 chars", () => {
    expect(slugify("a".repeat(60)).length).toBe(40);
  });
});
