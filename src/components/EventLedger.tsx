import { clock, dayMonth } from "@/lib/format";
import { dayKey } from "@/lib/event-types";
import type { EventItem } from "@/lib/types";

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "organiser";
  }
}

/** One line of the home page event list: yellow date block, serif title, where and when. */
export default function EventLedger({ e, todayKey }: { e: EventItem; todayKey: string }) {
  const today = dayKey(e.startsAt) <= todayKey;
  const time = clock(e.startsAt);
  const meta = [e.repeats, e.venueName, e.area && `${e.area} (nearby)`, e.price].filter(Boolean).join(" · ");
  const external = e.link && /^https?:\/\//i.test(e.link) ? e.link : undefined;
  const inner = (
    <>
      <span className="ledger-date">
        {today ? "Today" : dayMonth(e.startsAt)}
        {time ? <span>{time}</span> : null}
      </span>
      <span className="ledger-text">
        <span className="ledger-title">{e.title}</span>
        {meta ? <span className="ledger-meta">{meta}</span> : null}
        {external ? <span className="ledger-ext">Details on {host(external)} ↗</span> : null}
      </span>
    </>
  );
  return external ? (
    <a href={external} className="ledger-row" target="_blank" rel="noopener noreferrer">
      {inner}
      <span className="sr"> (opens in a new tab)</span>
    </a>
  ) : (
    <div className="ledger-row">{inner}</div>
  );
}
