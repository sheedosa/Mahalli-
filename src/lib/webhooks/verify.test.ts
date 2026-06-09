import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyHmacSignature } from "@/lib/webhooks/verify";

const secret = "test_secret";
const body = JSON.stringify({ hello: "world", n: 1 });
const sig = crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");

describe("verifyHmacSignature", () => {
  it("accepts a valid signature", () => {
    expect(verifyHmacSignature(body, sig, secret)).toBe(true);
  });

  it("accepts a prefixed signature (sha256=…)", () => {
    expect(verifyHmacSignature(body, `sha256=${sig}`, secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(verifyHmacSignature(body + "x", sig, secret)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    expect(verifyHmacSignature(body, sig, "nope")).toBe(false);
  });

  it("rejects empty signature or secret", () => {
    expect(verifyHmacSignature(body, "", secret)).toBe(false);
    expect(verifyHmacSignature(body, sig, "")).toBe(false);
  });

  it("rejects a malformed (non-hex) signature without throwing", () => {
    expect(verifyHmacSignature(body, "zzzz", secret)).toBe(false);
  });
});
