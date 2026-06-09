import crypto from "node:crypto";

/**
 * Verify an HMAC-SHA256 signature over the raw request body. `signature` may be
 * a bare hex digest or prefixed (e.g. "sha256=<hex>"). Constant-time compare.
 * Shared by the inbound webhook routes added in P1 (WhatsApp/Meta) and P4
 * (payments).
 */
export function verifyHmacSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const provided = signature.includes("=") ? signature.slice(signature.indexOf("=") + 1) : signature;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  let a: Buffer;
  let b: Buffer;
  try {
    a = Buffer.from(provided, "hex");
    b = Buffer.from(expected, "hex");
  } catch {
    return false;
  }
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
