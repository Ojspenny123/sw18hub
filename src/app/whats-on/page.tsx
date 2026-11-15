import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getEvents } from "@/lib/contentful";
import { dayNum, dayShort, timeShort } from "@/lib/format";
import { abs } from "@/lib/seo";
import type { EventItem } from "@/lib/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "What's on in SW18: events in Wandsworth, Earlsfield and Southfields",
  description: "Upcoming events, quiz nights, markets and things to do in SW18, listed by date with links to the organisers.",
  alternates: { canonical: "/whats-on" },
};

const TZ = "Europe/London";
const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
const heading = (key: string, todayKey: string, tomorrowKey: string) => {
  if (key === todayKey) return "Today";
  if (key === tomorrowKey) return "Tomorrow";
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
};

export default async function WhatsOnPage() {
  const events = await getEvents();
  const now = Date.now();
  const todayKey = dayKey(new Date(now).toISOString());
  const tomorrowKey = dayKey(new Date(now + 86400000).toISOString());

  // Events that started before today but are still running (e.g. exhibitions) go in their own group.
  const ongoing = events.filter((e) => dayKey(e.startsAt) < todayKey);
  const upcoming = events.filter((e) => dayKey(e.startsAt) >= todayKey);
  const groups = new Map<string, EventItem[]>();
  for (const e of upcoming) {
    const k = dayKey(e.startsAt);
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }

  const Row = ({ e }: { e: EventItem }) => {
    const body = (
      <>
        <div className="date">
          <span>{dayShort(e.startsAt)}</span>
          <b>{dayNum(e.startsAt)}</b>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>{e.title}</div>
          <div className="small muted">
            {[e.venueName, timeShort(e.startsAt), e.price, e.source && `via ${e.source}`].filter(Boolean).join(" · ")}
          </div>
          {e.description ? <div className="small" style={{ marginTop: 4 }}>{e.description}</div> : null}
        </div>
      </>
    );
    return e.link ? (
      <a href={e.link} className="event" target="_blank" rel="noopener noreferrer">
        {body}
      </a>
    ) : (
      <div className="event">{body}</div>
    );
  };

  return (
    <div className="wrap section" style={{ paddingTop: 24 }}>
      <JsonLd
        data={events.slice(0, 30).map((e) => ({
          "@context": "https://schema.org",
          "@type": "Event",
          name: e.title,
          startDate: e.startsAt,
          ...(e.endsAt ? { endDate: e.endsAt } : {}),
          ...(e.description ? { description: e.description } : {}),
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: { "@type": "Place", name: e.venueName ?? "SW18", address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" } },
          url: e.link ?? abs("/whats-on"),
        }))}
      />
      <h1 className="title">What&apos;s on in SW18</h1>
      <p className="muted" style={{ margin: "8px 0 20px" }}>
        Quiz nights, markets, classes and community events in Wandsworth Town, Earlsfield, Southfields and Wandsworth Common. Each one links to the organiser for tickets and details.
      </p>

      {events.length === 0 ? (
        <p className="muted">No upcoming events listed yet. Check back soon.</p>
      ) : (
        <div className="stack" style={{ gap: 24 }}>
          {[...groups.entries()].map(([key, list]) => (
            <section key={key} aria-labelledby={`d-${key}`}>
              <h2 id={`d-${key}`} style={{ fontSize: 20, marginBottom: 10 }}>
                {heading(key, todayKey, tomorrowKey)}
              </h2>
              <div className="stack" style={{ gap: 8 }}>
                {list.map((e) => (
                  <Row key={e.id} e={e} />
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
                {ongoing.map((e) => (
                  <Row key={e.id} e={e} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <div className="panel" style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20 }}>Running an event in SW18?</h2>
        <p className="small muted">Tell us and we&apos;ll add it. It&apos;s free to be listed.</p>
        <Link href="/deals#business" className="btn">
          Tell us about it
        </Link>
      </div>
    </div>
  );
}
