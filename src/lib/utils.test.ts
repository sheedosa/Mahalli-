import { describe, it, expect } from "vitest";
import { cn, formatPrice } from "@/lib/utils";

describe("cn", () => {
  it("merges conflicting Tailwind classes, last wins", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("keeps non-conflicting classes and drops falsy", () => {
    expect(cn("flex", false && "hidden", "gap-2")).toBe("flex gap-2");
  });
});

describe("formatPrice", () => {
  it("appends the Arabic currency suffix for ar", () => {
    expect(formatPrice(1000, "ar")).toContain("د.ل");
  });
  it("appends LYD for en and formats the number", () => {
    const out = formatPrice(1000, "en");
    expect(out).toContain("LYD");
    expect(out).toMatch(/1,?000/);
  });
  it("handles zero", () => {
    expect(formatPrice(0, "en")).toContain("0");
  });
});
