import { clock, dayMonth } from "@/lib/format";
import { addDays, dayKey, eventType } from "@/lib/event-types";
import type { EventItem } from "@/lib/types";

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "external site";
  }
}

/** Card for the "Next up" row: picture, day, title, time and place. Links to the organiser when there is a link. */
export default function EventCard({ e, todayKey }: { e: EventItem; todayKey: string }) {
  const k = dayKey(e.startsAt);
  const day = k <= todayKey ? "Today" : k === addDays(todayKey, 1) ? "Tomorrow" : dayMonth(e.startsAt);
  const time = clock(e.startsAt);
  const place = [e.venueName, e.area && `${e.area} (nearby)`].filter(Boolean).join(", ");
  const type = eventType(e);
  const external = e.link && /^https?:\/\//i.test(e.link) ? e.link : undefined;
  const body = (
    <>
      {e.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="ncard-img" src={e.image} alt="" loading="lazy" />
      ) : (
        <span className="ncard-img ncard-tile" data-type={type} aria-hidden="true">
          {type}
        </span>
      )}
      <span className="ncard-body">
        <span className="ncard-day">{[day, e.repeats].filter(Boolean).join(" · ")}</span>
        <span className="ncard-title">{e.title}</span>
        <span className="ncard-meta">{[time, place].filter(Boolean).join(" · ")}</span>
        {external ? <span className="ncard-ext">Details on {host(external)} ↗</span> : null}
      </span>
    </>
  );
  return external ? (
    <a href={external} className="ncard" target="_blank" rel="noopener noreferrer" aria-label={`${e.title}. Opens ${host(external)} in a new tab`}>
      {body}
    </a>
  ) : (
    <div className="ncard">{body}</div>
  );
}
