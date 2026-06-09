// Exponential backoff for outbox retries. Pure + deterministic so it can be
// unit-tested and reasoned about. `attempts` is the number of tries already made
// (the outbox increments it on claim), so attempts=1 is the first retry delay.

export const MAX_ATTEMPTS = 6;
const BASE_MS = 1_000; // 1s
const CAP_MS = 15 * 60 * 1_000; // 15 min

/** Delay before the next retry, in ms: min(2^(attempts-1) * 1s, 15min). */
export function nextBackoffMs(attempts: number): number {
  const n = Math.max(1, Math.floor(attempts));
  const exp = BASE_MS * 2 ** (n - 1);
  return Math.min(exp, CAP_MS);
}

/** True once we've exhausted retries and should mark the job failed. */
export function isExhausted(attempts: number): boolean {
  return attempts >= MAX_ATTEMPTS;
}
