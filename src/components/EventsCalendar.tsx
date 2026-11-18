"use client";

import { useMemo, useState } from "react";
import EventRow from "./EventRow";
import { addDays, longDay, monthLabel, weekday } from "@/lib/event-types";
import type { EventItem } from "@/lib/types";

type Item = { e: EventItem; start: string; end: string };

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const shiftMonth = (ym: string, n: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

/** Month grid. Days with events are tappable; the day's events list underneath. */
export default function EventsCalendar({ items, todayKey, startDay }: { items: Item[]; todayKey: string; startDay?: string }) {
  const thisMonth = todayKey.slice(0, 7);
  const lastMonth = useMemo(() => items.reduce((m, it) => (it.start.slice(0, 7) > m ? it.start.slice(0, 7) : m), thisMonth), [items, thisMonth]);
  const [ym, setYm] = useState(startDay ? startDay.slice(0, 7) : thisMonth);
  const [picked, setPicked] = useState<string | null>(startDay ?? todayKey);

  // Day key -> events on that day. Very long runs (exhibitions) only mark their start day.
  const byDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const it of items) {
      const span = Math.round((Date.parse(`${it.end}T12:00:00Z`) - Date.parse(`${it.start}T12:00:00Z`)) / 86400000);
      if (span > 14) {
        if (it.start >= todayKey) map.set(it.start, [...(map.get(it.start) ?? []), it.e]);
        continue;
      }
      for (let i = 0; i <= span; i++) {
        const k = addDays(it.start, i);
        map.set(k, [...(map.get(k) ?? []), it.e]);
      }
    }
    return map;
  }, [items, todayKey]);

  const first = `${ym}-01`;
  const lead = (weekday(first) + 6) % 7;
  const [y, m] = ym.split("-").map(Number);
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: dim }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`)];
  while (cells.length % 7) cells.push(null);

  const dayEvents = picked ? (byDay.get(picked) ?? []) : [];
  const monthCount = [...byDay.entries()].filter(([k]) => k.startsWith(ym)).reduce((n, [, l]) => n + l.length, 0);

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" className="chip" aria-label="Previous month" disabled={ym <= thisMonth} onClick={() => { setYm(shiftMonth(ym, -1)); setPicked(null); }}>
          ‹
        </button>
        <h2 style={{ fontSize: 20 }} aria-live="polite">
          {monthLabel(ym)}
        </h2>
        <button type="button" className="chip" aria-label="Next month" disabled={ym >= lastMonth} onClick={() => { setYm(shiftMonth(ym, 1)); setPicked(null); }}>
          ›
        </button>
      </div>
      <div className="cal-grid" role="grid" aria-label={monthLabel(ym)}>
        {DOW.map((d) => (
          <div key={d} className="cal-dow" role="columnheader">
            {d}
          </div>
        ))}
        {cells.map((k, i) => {
          if (!k) return <div key={`b${i}`} className="cal-cell blank" />;
          const n = byDay.get(k)?.length ?? 0;
          const cls = `cal-cell${n ? " has" : ""}${k === todayKey ? " today" : ""}${k === picked ? " sel" : ""}${k < todayKey ? " past" : ""}`;
          return (
            <button key={k} type="button" className={cls} disabled={!n} aria-pressed={k === picked} aria-label={`${longDay(k)}${n ? `, ${n} ${n === 1 ? "event" : "events"}` : ""}`} onClick={() => setPicked(k)}>
              <span className="cal-num">{Number(k.slice(8))}</span>
              {n ? <span className="cal-n">{n}</span> : null}
            </button>
          );
        })}
      </div>
      <p className="small muted" style={{ marginTop: 10 }}>
        {monthCount ? `${monthCount} ${monthCount === 1 ? "listing" : "listings"} this month. Tap a day to see them.` : "Nothing listed this month."}
      </p>
      {picked && dayEvents.length ? (
        <section style={{ marginTop: 16 }} aria-label={longDay(picked)}>
          <h3 style={{ fontSize: 18, marginBottom: 10 }}>{longDay(picked)}</h3>
          <div className="stack" style={{ gap: 8 }}>
            {dayEvents.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
