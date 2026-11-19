import NewsCard from "@/components/NewsCard";
import type { Metadata } from "next";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import { getEvents, getNews } from "@/lib/contentful";
import { NEWS_TOPICS } from "@/lib/types";
import EventRow from "@/components/EventRow";
import JsonLd from "@/components/JsonLd";
import { abs } from "@/lib/seo";

export const metadata: Metadata = {
  title: "SW18 local news and what's on",
  description: "Latest local news for Wandsworth, Earlsfield and Southfields from trusted local sources, plus events and things to do in SW18.",
  alternates: { canonical: "/news" },
  openGraph: { title: "SW18 local news and what's on", description: "Latest local news for Wandsworth, Earlsfield and Southfields from trusted local sources, plus events and things to do in SW18.", url: "/news", type: "website", siteName: "SW18 Hub", locale: "en_GB" },
  twitter: { card: "summary_large_image", title: "SW18 local news and what's on", description: "Latest local news for Wandsworth, Earlsfield and Southfields from trusted local sources, plus events and things to do in SW18." },
};

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ topic?: string; area?: string }> }) {
  const { topic, area } = await searchParams;
  const sw18Only = area === "sw18";
  const href = (t?: string, a?: string) => {
    const q = new URLSearchParams();
    if (t) q.set("topic", t);
    if (a) q.set("area", a);
    return q.size ? `/news?${q}` : "/news";
  };
  const [all, events] = await Promise.all([getNews(), getEvents()]);
  const news = all.filter((n) => (!topic || n.topic === topic) && (!sw18Only || n.sw18));

  return (
    <div className="wrap section" style={{ paddingTop: 24 }}>
      <JsonLd
        data={events.slice(0, 20).map((e) => ({
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
      <h1 className="title">SW18 local news</h1>
      <div className="chips" role="group" aria-label="Area">
        <Link href={href(topic)} className={`chip${!sw18Only ? " on" : ""}`}>
          All of Wandsworth
        </Link>
        <Link href={href(topic, "sw18")} className={`chip${sw18Only ? " on" : ""}`}>
          SW18 only
        </Link>
      </div>
      <div className="chips">
        {[undefined, ...NEWS_TOPICS].map((t) => (
          <Link key={t ?? "all"} href={href(t, sw18Only ? "sw18" : undefined)} className={`chip${topic === t || (!topic && !t) ? " on" : ""}`}>
            {t ?? "All topics"}
          </Link>
        ))}
      </div>

      {news.length ? (
        <div className="news-grid">
          {news.slice(0, 24).map((n) => (
            <NewsCard key={n.id} n={n} />
          ))}
        </div>
      ) : (
        <div className="empty">{sw18Only ? "No SW18 stories right now. Try All of Wandsworth." : "No news right now. Check back soon."}</div>
      )}

      <div className="extras">
        <div className="panel" id="whats-on">
          <h2 style={{ fontSize: 20 }}>What&apos;s on</h2>
          {events.length ? events.slice(0, 5).map((e) => <EventRow key={e.id} e={e} showType={false} />) : <p className="small muted">No upcoming events yet.</p>}
          <Link href="/whats-on" className="more-link">
            See all events
          </Link>
        </div>
        <div className="panel">
          <h2 style={{ fontSize: 20 }}>Weekly SW18 round-up</h2>
          <p className="small muted">News, events and new places in one email.</p>
          <LeadForm formName="waitlist" fields={[{ name: "email", label: "Your email", type: "email" }]} button="Subscribe" done="Thanks, you are on the list." />
        </div>
      </div>
    </div>
  );
}
