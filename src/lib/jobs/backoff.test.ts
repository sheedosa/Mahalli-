import { describe, it, expect } from "vitest";
import { nextBackoffMs, isExhausted, MAX_ATTEMPTS } from "@/lib/jobs/backoff";

describe("nextBackoffMs", () => {
  it("grows exponentially from 1s", () => {
    expect(nextBackoffMs(1)).toBe(1_000);
    expect(nextBackoffMs(2)).toBe(2_000);
    expect(nextBackoffMs(3)).toBe(4_000);
    expect(nextBackoffMs(4)).toBe(8_000);
  });

  it("is monotonic non-decreasing", () => {
    let prev = 0;
    for (let n = 1; n <= 14; n++) {
      const v = nextBackoffMs(n);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it("caps at 15 minutes", () => {
    expect(nextBackoffMs(100)).toBe(15 * 60 * 1_000);
  });

  it("clamps non-positive attempts to the first delay", () => {
    expect(nextBackoffMs(0)).toBe(1_000);
    expect(nextBackoffMs(-5)).toBe(1_000);
  });
});

describe("isExhausted", () => {
  it("is false below the cap and true at/after it", () => {
    expect(isExhausted(MAX_ATTEMPTS - 1)).toBe(false);
    expect(isExhausted(MAX_ATTEMPTS)).toBe(true);
    expect(isExhausted(MAX_ATTEMPTS + 3)).toBe(true);
  });
});
