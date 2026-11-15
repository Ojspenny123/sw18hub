import NewsThumb from "@/components/NewsThumb";
import type { Metadata } from "next";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import { getEvents, getNews } from "@/lib/contentful";
import { NEWS_TOPICS } from "@/lib/types";
import { dayNum, dayShort, timeAgo, timeShort } from "@/lib/format";

export const metadata: Metadata = { title: "Local news and events" };

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
    <div className="wrap section" style={{ paddingTop: 28 }}>
      <h1 className="title">Local news</h1>
      <div className="chips">
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

      <div className="row" style={{ gap: 32, alignItems: "flex-start" }}>
        <div style={{ flex: "2 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          {lead ? (
            <a href={lead.sourceUrl ?? "#"} className="card" style={{ flex: "none" }}>
              <NewsThumb n={lead} className="card-img" width={1200} style={{ height: 300 }} />
              <div className="card-body" style={{ padding: "20px 24px 24px", gap: 8 }}>
                <div className="topic">{lead.topic}</div>
                <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>{lead.title}</div>
                <p className="muted">{lead.summary}</p>
                <div className="small muted">
                  {lead.sourceName ? `${lead.sourceName} · ` : ""}
                  {timeAgo(lead.publishedAt)}
                  {lead.sourceUrl ? " · Read at source" : ""}
                </div>
              </div>
            </a>
          ) : (
            <div className="empty">{sw18Only ? "No SW18 stories right now. Try All of Wandsworth." : "No news right now. Check back soon."}</div>
          )}
          {rest.map((n) => (
            <a key={n.id} href={n.sourceUrl ?? "#"} className="news-item" style={{ flexWrap: "wrap" }}>
              <NewsThumb n={n} className="thumb" width={400} style={{ width: 160, height: 112 }} />
              <div style={{ flex: "1 1 260px", minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="topic">{n.topic}</div>
                <div style={{ fontWeight: 600, fontSize: 18 }}>{n.title}</div>
                <div className="small muted">{n.summary}</div>
                <div className="small muted">
                  {n.sourceName ? `${n.sourceName} · ` : ""}
                  {timeAgo(n.publishedAt)}
                </div>
              </div>
            </a>
          ))}
        </div>

        <aside style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="panel" id="whats-on" style={{ gap: 12 }}>
            <h2 style={{ fontSize: 20 }}>What&apos;s on</h2>
            {events.length ? (
              events.slice(0, 8).map((e) => (
                <a key={e.id} href={e.link ?? "#whats-on"} className="event" style={{ padding: 10, gap: 12 }}>
                  <div className="date" style={{ width: 52 }}>
                    <span>{dayShort(e.startsAt)}</span>
                    <b style={{ fontSize: 18 }}>{dayNum(e.startsAt)}</b>
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
          <div className="panel" style={{ gap: 10 }}>
            <h2 style={{ fontSize: 20 }}>Weekly SW18 round-up</h2>
            <p className="small muted">News, events and new places in one email.</p>
            <LeadForm formName="waitlist" fields={[{ name: "email", label: "Your email", type: "email" }]} button="Subscribe" done="Thanks, you are on the list." />
          </div>
        </aside>
      </div>
    </div>
  );
}
