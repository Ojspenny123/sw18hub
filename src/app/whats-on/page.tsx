import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getEvents, getPopups } from "@/lib/contentful";
import EventsExplorer from "@/components/EventsExplorer";
import { dayKey } from "@/lib/event-types";
import { abs } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "What's on in SW18: events in Wandsworth, Earlsfield and Southfields",
  description: "Upcoming events, quiz nights, markets and things to do in SW18, listed by date with links to the organisers.",
  alternates: { canonical: "/whats-on" },
  openGraph: { title: "What's on in SW18: events in Wandsworth, Earlsfield and Southfields", description: "Upcoming events, quiz nights, markets and things to do in SW18, listed by date with links to the organisers.", url: "/whats-on", type: "website", siteName: "SW18 Hub", locale: "en_GB" },
  twitter: { card: "summary_large_image", title: "What's on in SW18: events in Wandsworth, Earlsfield and Southfields", description: "Upcoming events, quiz nights, markets and things to do in SW18, listed by date with links to the organisers." },
};

export default async function WhatsOnPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const { day } = await searchParams;
  const startDay = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined;
  const [events, featured] = await Promise.all([getEvents(), getPopups()]);
  const todayKey = dayKey(new Date().toISOString());

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
        Quiz nights, markets, classes and community events in Wandsworth Town, Earlsfield, Southfields and Wandsworth Common, plus nearby weekly events like parkruns in Tooting, Battersea, Clapham and Fulham. Each one links to the organiser for tickets and details.
      </p>

      {featured
        .filter((f) => f.slug)
        .map((f) => (
          <Link key={f.id} href={`/featured/${f.slug}`} className="feat">
            {f.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.imageUrl} alt="" />
            ) : null}
            <div>
              <div className="feat-k">Featured</div>
              <h2>{f.heading}</h2>
              {f.detail ? <p className="small muted">{f.detail}</p> : null}
            </div>
          </Link>
        ))}

      {events.length === 0 ? <p className="muted">No upcoming events listed yet. Check back soon.</p> : <EventsExplorer events={events} todayKey={todayKey} startDay={startDay} />}

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
