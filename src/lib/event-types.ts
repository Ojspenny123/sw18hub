import type { EventItem } from "./types";

/** Event types shown as filters. Worked out from the title and description, so it also covers feed events. */
export const EVENT_TYPES = [
  "Quiz and games",
  "Music and nightlife",
  "Food and drink",
  "Markets and fairs",
  "Classes and workshops",
  "Arts and culture",
  "Family",
  "Community",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

const RULES: [EventType, RegExp][] = [
  ["Quiz and games", /\b(quiz|bingo|trivia|board game|games night|poker|bridge|chess)\b/i],
  ["Markets and fairs", /\b(market|fair|fête|fete|festival|switch[- ]?on|christmas lights|yard sale|car boot)\b/i],
  ["Classes and workshops", /\b(workshop|class|course|wreath|making|masterclass|lesson|fitness|yoga|pilates|run club|talk|lecture)\b/i],
  ["Music and nightlife", /\b(live music|gig|concert|dj|jazz|band|karaoke|open mic|choir|opera|comedy|club night|disco)\b/i],
  ["Food and drink", /\b(tasting|supper|dinner|brunch|beer|brewery|wine|cocktail|food|street food|pop-?up)\b/i],
  ["Arts and culture", /\b(exhibition|gallery|theatre|theater|film|cinema|screening|art|heritage|history|walk|tour|book)\b/i],
  ["Family", /\b(family|kids|children|toddler|storytime|story time|santa|grotto)\b/i],
];

export function eventType(e: Pick<EventItem, "title" | "description">): EventType {
  const title = e.title;
  // Title first (strongest signal), then the description.
  for (const [type, re] of RULES) if (re.test(title)) return type;
  for (const [type, re] of RULES) if (e.description && re.test(e.description)) return type;
  return "Community";
}

/* ---------- London calendar-day helpers (YYYY-MM-DD keys) ---------- */
const TZ = "Europe/London";
export const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
export const addDays = (key: string, n: number) => {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** 0 = Sunday ... 6 = Saturday */
export const weekday = (key: string) => new Date(`${key}T12:00:00Z`).getUTCDay();
export const monthLabel = (ym: string) =>
  new Date(`${ym}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
export const longDay = (key: string) =>
  new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
