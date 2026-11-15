import NewsThumb from "@/components/NewsThumb";
import type { Metadata } from "next";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import { getEvents, getNews } from "@/lib/contentful";
import { NEWS_TOPICS } from "@/lib/types";
import { dayNum, dayShort, timeAgo, timeShort } from "@/lib/format";
import JsonLd from "@/components/JsonLd";
import { abs } from "@/lib/seo";

export const metadata: Metadata = {
  title: "SW18 local news and what's on",
  description: "Latest local news for Wandsworth, Earlsfield and Southfields from trusted local sources, plus events and things to do in SW18.",
  alternates: { canonical: "/news" },
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
  const lead = news.find((n) => n.featured) ?? news[0];
  const rest = news.filter((n) => n.id !== lead?.id);

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
          url: e.link ?? abs("/news#whats-on"),
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

      <div className="news-cols">
        <div className="news-main">
          {lead ? (
            <a href={lead.sourceUrl ?? "#"} className="card news-feature" target="_blank" rel="noopener noreferrer">
              <NewsThumb n={lead} className="card-img" width={1200} />
              <div className="card-body">
                <div className="topic">{lead.topic}</div>
                <div className="headline">{lead.title}</div>
                <p className="muted">{lead.summary}</p>
                <div className="small muted">
                  {lead.sourceName ? `${lead.sourceName} · ` : ""}
                  {timeAgo(lead.publishedAt)}
                </div>
                {lead.sourceUrl ? <div className="ext">Read on {lead.sourceName ?? "the publisher\u2019s site"} <span aria-hidden="true">↗</span> <span className="sr">(opens in a new tab)</span></div> : null}
              </div>
            </a>
          ) : (
            <div className="empty">{sw18Only ? "No SW18 stories right now. Try All of Wandsworth." : "No news right now. Check back soon."}</div>
          )}
          {rest.map((n) => (
            <a key={n.id} href={n.sourceUrl ?? "#"} className="news-item" target="_blank" rel="noopener noreferrer">
              <NewsThumb n={n} className="thumb" width={400} />
              <div className="text">
                <div className="topic">{n.topic}</div>
                <div className="headline">{n.title}</div>
                <div className="small muted">{n.summary}</div>
                <div className="small muted">
                  {n.sourceName ? `${n.sourceName} · ` : ""}
                  {timeAgo(n.publishedAt)}
                </div>
                {n.sourceUrl ? <div className="ext">Read on {n.sourceName ?? "the publisher\u2019s site"} <span aria-hidden="true">↗</span> <span className="sr">(opens in a new tab)</span></div> : null}
              </div>
            </a>
          ))}
        </div>

        <aside className="news-side">
          <div className="panel" id="whats-on">
            <h2 style={{ fontSize: 20 }}>What&apos;s on</h2>
            {events.length ? (
              events.slice(0, 8).map((e) => (
                <a key={e.id} href={e.link ?? "#whats-on"} className="event">
                  <div className="date">
                    <span>{dayShort(e.startsAt)}</span>
                    <b>{dayNum(e.startsAt)}</b>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{e.title}</div>
                    <div className="small muted">{[e.venueName, timeShort(e.startsAt), e.price].filter(Boolean).join(" · ")}</div>
                  </div>
                </a>
              ))
            ) : (
              <p className="small muted">No upcoming events yet.</p>
            )}
          </div>
          <div className="panel">
            <h2 style={{ fontSize: 20 }}>Weekly SW18 round-up</h2>
            <p className="small muted">News, events and new places in one email.</p>
            <LeadForm formName="waitlist" fields={[{ name: "email", label: "Your email", type: "email" }]} button="Subscribe" done="Thanks, you are on the list." />
          </div>
        </aside>
      </div>
    </div>
  );
}
