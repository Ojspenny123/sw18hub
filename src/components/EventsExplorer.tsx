"use client";

import { useMemo, useState } from "react";
import EventRow from "./EventRow";
import EventsCalendar from "./EventsCalendar";
import { EVENT_TYPES, addDays, dayKey, eventType, longDay, monthLabel, weekday, type EventType } from "@/lib/event-types";
import type { EventItem } from "@/lib/types";

type When = "any" | "today" | "weekend" | "week" | `m:${string}`;

export default function EventsExplorer({ events, todayKey, startDay }: { events: EventItem[]; todayKey: string; startDay?: string }) {
  const [when, setWhen] = useState<When>("any");
  const [type, setType] = useState<EventType | "all">("all");
  const [view, setView] = useState<"list" | "calendar">(startDay ? "calendar" : "list");
  const [where, setWhere] = useState<"all" | "local" | "nearby">("all");

  // Every event as a date range of London calendar days.
  const items = useMemo(
    () =>
      events.map((e) => {
        const start = dayKey(e.startsAt);
        const end = e.endsAt ? dayKey(e.endsAt) : start;
        return { e, start, end: end < start ? start : end, type: eventType(e) };
      }),
    [events],
  );
  const nearbyCount = items.filter((it) => it.e.area).length;
  const byWhere = items.filter((it) => where === "all" || (where === "nearby" ? Boolean(it.e.area) : !it.e.area));

  const range = (w: When): [string, string] | null => {
    if (w === "any") return null;
    if (w === "today") return [todayKey, todayKey];
    if (w === "week") return [todayKey, addDays(todayKey, 6)];
    if (w === "weekend") {
      const dow = weekday(todayKey);
      if (dow === 0) return [todayKey, todayKey];
      if (dow === 6) return [todayKey, addDays(todayKey, 1)];
      const sat = addDays(todayKey, 6 - dow);
      return [sat, addDays(sat, 1)];
    }
    const ym = w.slice(2);
    return [`${ym}-01`, `${ym}-31`];
  };

  const inRange = (it: { start: string; end: string }, r: [string, string] | null) => !r || (it.start <= r[1] && it.end >= r[0]);

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) set.add((it.start < todayKey ? todayKey : it.start).slice(0, 7));
    return [...set].sort();
  }, [items, todayKey]);

  const byWhen = byWhere.filter((it) => inRange(it, range(when)));
  const typeCounts = new Map<EventType, number>();
  const countedSeries = new Set<string>();
  for (const it of byWhen) {
    if (it.e.series) {
      if (countedSeries.has(it.e.series)) continue;
      countedSeries.add(it.e.series);
    }
    typeCounts.set(it.type, (typeCounts.get(it.type) ?? 0) + 1);
  }
  const matched = byWhen.filter((it) => type === "all" || it.type === type);
  // The list shows each weekly event once (its next date). The calendar shows every date.
  const seenSeries = new Set<string>();
  const shown = matched.filter((it) => {
    if (!it.e.series) return true;
    if (seenSeries.has(it.e.series)) return false;
    seenSeries.add(it.e.series);
    return true;
  });

  const whenCount = (w: When) => byWhere.filter((it) => inRange(it, range(w))).length;
  const whenChips: { id: When; label: string }[] = [
    { id: "any", label: "Any time" },
    { id: "today", label: "Today" },
    { id: "weekend", label: "This weekend" },
    { id: "week", label: "Next 7 days" },
    ...months.map((m): { id: When; label: string } => ({ id: `m:${m}`, label: monthLabel(m).split(" ")[0] })),
  ];

  // Group by start day; events that started before today and are still running go last.
  const upcoming = shown.filter((it) => it.start >= todayKey);
  const ongoing = shown.filter((it) => it.start < todayKey);
  const groups = new Map<string, EventItem[]>();
  for (const it of upcoming) groups.set(it.start, [...(groups.get(it.start) ?? []), it.e]);
  const heading = (k: string) => (k === todayKey ? "Today" : k === addDays(todayKey, 1) ? "Tomorrow" : longDay(k));

  return (
    <>
      <div className="stack" style={{ gap: 10, marginBottom: 20 }}>
        <div className="chips" role="group" aria-label="View">
          <button type="button" className={`chip${view === "list" ? " on" : ""}`} aria-pressed={view === "list"} onClick={() => setView("list")}>
            List
          </button>
          <button type="button" className={`chip${view === "calendar" ? " on" : ""}`} aria-pressed={view === "calendar"} onClick={() => setView("calendar")}>
            Calendar
          </button>
        </div>
        {view === "list" && (
        <div className="chips" role="group" aria-label="When">
          {whenChips.map((c) => {
            const n = whenCount(c.id);
            const disabled = n === 0 && c.id !== when;
            return (
              <button key={c.id} type="button" className={`chip${when === c.id ? " on" : ""}`} aria-pressed={when === c.id} disabled={disabled} style={disabled ? { opacity: 0.45 } : undefined} onClick={() => setWhen(c.id)}>
                {c.label}
              </button>
            );
          })}
        </div>
        )}
        {nearbyCount > 0 && (
          <div className="chips" role="group" aria-label="Where">
            {([["all", "Everywhere"], ["local", "SW18 and Putney"], ["nearby", "Nearby: Clapham, Fulham, Tooting, Battersea"]] as const).map(([id, label]) => (
              <button key={id} type="button" className={`chip${where === id ? " on" : ""}`} aria-pressed={where === id} onClick={() => setWhere(id)}>
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="chips" role="group" aria-label="Type of event">
          <button type="button" className={`chip${type === "all" ? " on" : ""}`} aria-pressed={type === "all"} onClick={() => setType("all")}>
            All types
          </button>
          {EVENT_TYPES.filter((t) => typeCounts.has(t) || t === type).map((t) => (
            <button key={t} type="button" className={`chip${type === t ? " on" : ""}`} aria-pressed={type === t} onClick={() => setType(t)}>
              {t} ({typeCounts.get(t) ?? 0})
            </button>
          ))}
        </div>
        <p className="small muted" aria-live="polite">
          {shown.length} {shown.length === 1 ? "event" : "events"}
          {(when !== "any" || type !== "all" || where !== "all") && (
            <>
              {" "}
              ·{" "}
              <button type="button" className="linklike" onClick={() => { setWhen("any"); setType("all"); setWhere("all"); }}>
                Clear filters
              </button>
            </>
          )}
        </p>
      </div>

      {view === "calendar" ? (
        <EventsCalendar items={byWhere.filter((it) => type === "all" || it.type === type)} todayKey={todayKey} startDay={startDay} />
      ) : shown.length === 0 ? (
        <p className="muted">Nothing matches those filters. Try another day or type.</p>
      ) : (
        <div className="stack" style={{ gap: 24 }}>
          {[...groups.entries()].map(([key, list]) => (
            <section key={key} aria-labelledby={`d-${key}`}>
              <h2 id={`d-${key}`} style={{ fontSize: 20, marginBottom: 10 }}>
                {heading(key)}
              </h2>
              <div className="stack" style={{ gap: 8 }}>
                {list.map((e) => (
                  <EventRow key={e.id} e={e} />
                ))}
              </div>
            </section>
          ))}
          {ongoing.length ? (
            <section aria-labelledby="ongoing">
              <h2 id="ongoing" style={{ fontSize: 20, marginBottom: 10 }}>
                Running now
              </h2>
              <div className="stack" style={{ gap: 8 }}>
                {ongoing.map((it) => (
                  <EventRow key={it.e.id} e={it.e} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
