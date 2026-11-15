/**
 * Best-effort limits for the chatbot, kept in memory. On serverless hosting each instance has its own
 * counters, so this stops casual abuse and runaway loops but is NOT a hard spend cap.
 * The hard cap is the monthly spend limit you set in the Anthropic Console.
 */
const perIp = new Map<string, number[]>();
let day = "";
let dayCount = 0;

const WINDOW_MS = 10 * 60 * 1000;
const PER_WINDOW = Number(process.env.ASK_PER_10_MIN ?? 10);
const PER_IP_DAY = Number(process.env.ASK_PER_IP_PER_DAY ?? 40);
const GLOBAL_DAY = Number(process.env.ASK_DAILY_LIMIT ?? 400);

export type Verdict = { ok: true } | { ok: false; reason: "slow-down" | "daily" | "busy" };

export function checkLimit(ip: string, now = Date.now()): Verdict {
  const today = new Date(now).toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    dayCount = 0;
    perIp.clear();
  }
  if (dayCount >= GLOBAL_DAY) return { ok: false, reason: "busy" };
  const hits = (perIp.get(ip) ?? []).filter((t) => now - t < 24 * 3600 * 1000);
  if (hits.length >= PER_IP_DAY) return { ok: false, reason: "daily" };
  if (hits.filter((t) => now - t < WINDOW_MS).length >= PER_WINDOW) return { ok: false, reason: "slow-down" };
  hits.push(now);
  perIp.set(ip, hits);
  dayCount++;
  if (perIp.size > 5000) perIp.clear(); // memory guard
  return { ok: true };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-nf-client-connection-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
