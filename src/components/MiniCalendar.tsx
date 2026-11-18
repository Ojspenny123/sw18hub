import Link from "next/link";
import { addDays, dayKey, monthLabel, weekday } from "@/lib/event-types";
import type { EventItem } from "@/lib/types";

/** Small month grid for the home page. Days with events link to that day on the What's on calendar. */
export default function MiniCalendar({ events, todayKey }: { events: EventItem[]; todayKey: string }) {
  const ym = todayKey.slice(0, 7);
  const days = new Set<string>();
  for (const e of events) {
    const start = dayKey(e.startsAt);
    const end = e.endsAt ? dayKey(e.endsAt) : start;
    // Long runs (exhibitions) would light up the whole month, so only mark their start day.
    const span = Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000);
    if (span > 14) days.add(start);
    else for (let i = 0; i <= span; i++) days.add(addDays(start, i));
  }
  const first = `${ym}-01`;
  const lead = (weekday(first) + 6) % 7;
  const [y, m] = ym.split("-").map(Number);
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: dim }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`)];

  return (
    <div className="mini-cal">
      <div className="mini-cal-title">{monthLabel(ym)}</div>
      <div className="mini-cal-grid">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="mini-cal-dow" aria-hidden="true">
            {d}
          </div>
        ))}
        {cells.map((k, i) => {
          if (!k) return <div key={`b${i}`} />;
          const n = Number(k.slice(8));
          const has = days.has(k) && k >= todayKey;
          const cls = `mini-cal-day${has ? " has" : ""}${k === todayKey ? " today" : ""}`;
          return has ? (
            <Link key={k} href={`/whats-on?day=${k}`} className={cls} aria-label={`See what is on, ${n} ${monthLabel(ym).split(" ")[0]}`}>
              {n}
            </Link>
          ) : (
            <div key={k} className={cls}>
              {n}
            </div>
          );
        })}
      </div>
      <p className="small muted" style={{ marginTop: 10 }}>Tap a highlighted day to see what is on.</p>
    </div>
  );
}
