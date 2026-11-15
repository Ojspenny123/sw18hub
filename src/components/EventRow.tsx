import { dayNum, dayShort, timeShort } from "@/lib/format";
import { dayKey, eventType } from "@/lib/event-types";
import type { EventItem } from "@/lib/types";

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "external site";
  }
}

/** One event. If it has a link, the whole row is a link and says plainly that it leaves SW18 Hub. */
export default function EventRow({ e, showType = true }: { e: EventItem; showType?: boolean }) {
  const external = e.link && /^https?:\/\//i.test(e.link) ? e.link : undefined;
  const multiDay = Boolean(e.endsAt) && dayKey(e.endsAt!) > dayKey(e.startsAt);
  const until = e.endsAt ? new Date(e.endsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" }) : "";
  const body = (
    <>
      <div className="date">
        <span>{dayShort(e.startsAt)}</span>
        <b>{dayNum(e.startsAt)}</b>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{e.title}</div>
        <div className="small muted">
          {[e.venueName, multiDay ? `until ${until}` : timeShort(e.startsAt), e.price, e.source && `via ${e.source}`].filter(Boolean).join(" · ")}
        </div>
        {e.description ? <div className="small ev-desc">{e.description}</div> : null}
        <div className="ev-foot">
          {showType ? <span className="tag">{eventType(e)}</span> : null}
          {external ? (
            <span className="ext">
              Details on {host(external)}
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 2H2.5A1 1 0 0 0 1.5 3v6.5a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-2M7 1.5h3.5V5M10.5 1.5 5.5 6.5" />
              </svg>
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
  return external ? (
    <a href={external} className="event event-ext" target="_blank" rel="noopener noreferrer" aria-label={`${e.title}. Opens ${host(external)} in a new tab`}>
      {body}
    </a>
  ) : (
    <div className="event">{body}</div>
  );
}
