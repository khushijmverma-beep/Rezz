// Per-user, in-memory. Resets when the server restarts and isn't shared
// across server instances. Fine for the demo.
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 10;

const hits = new Map<string, number[]>(); // uid -> request timestamps

export function checkRateLimit(
  uid: string
): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(uid) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    hits.set(uid, recent);
    const retryAfter = Math.ceil((recent[0] + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  recent.push(now);
  hits.set(uid, recent);
  return { allowed: true };
}