import type { EventItem } from "./types";
import { mentionsSW18 } from "./rss";

/**
 * Local events from public iCalendar (.ics) feeds. No API key, no cost.
 * Fetched once a week: the Sunday job revalidates EVENTS_CACHE_TAG (see netlify/functions/weekly-refresh.mjs).
 * We keep only events that mention SW18 or one of our areas, and always link back to the organiser.
 *
 * Add feeds here, or without a code change via the EVENT_ICAL_FEEDS env var:
 *   EVENT_ICAL_FEEDS="Name|https://example.com/feed.ics,Other name|https://example.org/cal.ics"
 */
export const EVENTS_CACHE_TAG = "events";

interface Feed {
  name: string;
  url: string;
  /** Feed is already SW18-only (e.g. a single church), so skip the location filter. */
  allLocal?: boolean;
}

const BUILT_IN_FEEDS: Feed[] = [
  // Putney.news has agreed to us listing their events, with a link back to each one.
  { name: "Putney.news", url: "https://putney.news/events/list/?hide_subsequent_recurrences=1&ical=1" },
];

function feeds(): Feed[] {
  const extra = (process.env.EVENT_ICAL_FEEDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s): Feed | null => {
      const i = s.indexOf("|");
      if (i < 1) return null;
      const url = s.slice(i + 1).trim().replace(/^webcal:/i, "https:");
      return /^https:\/\//i.test(url) ? { name: s.slice(0, i).trim(), url, allLocal: true } : null;
    })
    .filter((f): f is Feed => f !== null);
  return [...BUILT_IN_FEEDS, ...extra];
}

/* ---------- iCalendar parsing ---------- */

type Prop = { params: Record<string, string>; value: string };

function unfold(ics: string): string[] {
  const out: string[] = [];
  for (const line of ics.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")) {
    if (/^[ \t]/.test(line) && out.length) out[out.length - 1] += line.slice(1);
    else out.push(line);
  }
  return out;
}

function parseLine(line: string): [string, Prop] | null {
  // NAME;PARAM=x;PARAM2="y:z":value  (the first ':' outside quotes ends the name/params)
  let inQuote = false;
  let colon = -1;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuote = !inQuote;
    else if (c === ":" && !inQuote) {
      colon = i;
      break;
    }
  }
  if (colon < 1) return null;
  const [name, ...rawParams] = line.slice(0, colon).split(";");
  const params: Record<string, string> = {};
  for (const p of rawParams) {
    const eq = p.indexOf("=");
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, "");
  }
  return [name.toUpperCase(), { params, value: line.slice(colon + 1) }];
}

const unescapeText = (s: string) => s.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1");

/** Offset (ms) of a named time zone from UTC at the given instant. */
function tzOffset(tz: string, at: Date): number {
  try {
    const f = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const p = Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - at.getTime();
  } catch {
    return 0;
  }
}

function parseDate(p: Prop | undefined): { iso: string; allDay: boolean } | null {
  if (!p) return null;
  const m = p.value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (h === undefined) {
    return { iso: new Date(Date.UTC(+y, +mo - 1, +d, 12)).toISOString(), allDay: true };
  }
  const asUtc = Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s ?? 0));
  if (z) return { iso: new Date(asUtc).toISOString(), allDay: false };
  // Floating or TZID times are local to that zone (default London).
  const tz = p.params.TZID || "Europe/London";
  const guess = new Date(asUtc - tzOffset(tz, new Date(asUtc)));
  const fixed = new Date(asUtc - tzOffset(tz, guess));
  return { iso: fixed.toISOString(), allDay: false };
}

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function short(s: string, max = 220): string {
  const t = stripHtml(s);
  return t.length > max ? t.slice(0, max).replace(/\s+\S*$/, "") + "…" : t;
}

export function parseIcs(ics: string, source: string, allLocal = false, now = new Date()): EventItem[] {
  const lines = unfold(ics);
  const events: EventItem[] = [];
  let cur: Record<string, Prop> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT") {
      if (cur) {
        const e = toEvent(cur, source, allLocal, now);
        if (e) events.push(e);
      }
      cur = null;
    } else if (cur) {
      const kv = parseLine(line);
      if (kv && !(kv[0] in cur)) cur[kv[0]] = kv[1];
    }
  }
  return events;
}

const MAX_SPAN_DAYS = 60; // skip very long-running listings (e.g. year-long exhibitions)

function toEvent(p: Record<string, Prop>, source: string, allLocal: boolean, now: Date): EventItem | null {
  const title = stripHtml(unescapeText(p.SUMMARY?.value ?? ""));
  const start = parseDate(p.DTSTART);
  if (!title || !start) return null;
  const end = parseDate(p.DTEND);
  const startMs = Date.parse(start.iso);
  // All-day DTEND is exclusive; step back a day so a one-day event ends the day it starts.
  const endMs = end ? Date.parse(end.iso) - (end.allDay ? 86400000 : 0) : startMs;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (Math.max(startMs, endMs) < today.getTime()) return null; // already over
  if ((endMs - startMs) / 86400000 > MAX_SPAN_DAYS) return null;
  if (/^(cancel|postponed)/i.test(p.STATUS?.value ?? "") || /^cancel/i.test(title)) return null;

  const location = stripHtml(unescapeText(p.LOCATION?.value ?? ""));
  const description = unescapeText(p.DESCRIPTION?.value ?? "");
  if (!allLocal && !mentionsSW18(`${title} ${location} ${description}`)) return null;

  const uid = p.UID?.value || `${title}-${start.iso}`;
  const link = (p.URL?.value || "").trim();
  return {
    id: `ical-${source}-${uid}`,
    title,
    slug: link || uid,
    description: description ? short(description) : undefined,
    startsAt: start.iso,
    endsAt: end ? new Date(endMs).toISOString() : undefined,
    venueName: location ? location.split(",")[0].trim() : undefined,
    link: /^https?:\/\//i.test(link) ? link : undefined,
    source,
  };
}

async function readFeed(f: Feed): Promise<EventItem[]> {
  try {
    const res = await fetch(f.url, {
      headers: { "User-Agent": "SW18Hub/1.0 (+local events listing; links back to organiser)", Accept: "text/calendar" },
      // Kept until the Sunday job revalidates EVENTS_CACHE_TAG; the 8-day limit is only a safety net.
      next: { revalidate: 8 * 24 * 60 * 60, tags: [EVENTS_CACHE_TAG] },
    });
    if (!res.ok) return [];
    const body = await res.text();
    if (!body.includes("BEGIN:VCALENDAR")) return [];
    return parseIcs(body, f.name, f.allLocal);
  } catch {
    return [];
  }
}

export async function getFeedEvents(): Promise<EventItem[]> {
  const all = (await Promise.all(feeds().map(readFeed))).flat();
  const seen = new Set<string>();
  return all.filter((e) => {
    const key = `${e.title.toLowerCase()}|${e.startsAt.slice(0, 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
