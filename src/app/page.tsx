import NewsThumb from "@/components/NewsThumb";
import Link from "next/link";
import VenueCard from "@/components/VenueCard";
import LeadForm from "@/components/LeadForm";
import { getEvents, getNews, getVenues } from "@/lib/contentful";
import { byRating, withRatings } from "@/lib/google";
import { dayNum, dayShort, timeAgo, timeShort } from "@/lib/format";

export const revalidate = 60;

const CHIPS = ["Best pubs near Earlsfield", "Sunday roast", "What is on this weekend?"];
const CATEGORIES = ["Pubs", "Bars", "Cafes", "Restaurants", "Takeaways"];

export default async function Home() {
  const [venues, news, events] = await Promise.all([getVenues(), getNews(), getEvents()]);
  const rated = await withRatings(venues);
  const top = [...rated].sort((a, b) => byRating(a, b) || Number(b.featured) - Number(a.featured)).slice(0, 4);
  const lead = news.find((n) => n.featured) ?? news[0];
  const more = news.filter((n) => n.id !== lead?.id).slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="hero-text">
            <h1>Everything happening in SW18</h1>
            <p className="lead">Top-rated places, local news, events and deals for Wandsworth, Earlsfield and Southfields.</p>
            <form action="/ask" className="askbox">
              <label htmlFor="q" style={{ position: "absolute", left: -9999 }}>
                Ask SW18
              </label>
              <input id="q" name="q" type="text" placeholder="Ask anything, e.g. dog-friendly pubs with a garden" />
              <button type="submit" className="btn">
                Ask
              </button>
            </form>
            <div className="chips">
              {CHIPS.map((c) => (
                <Link key={c} href={`/ask?q=${encodeURIComponent(c)}`} className="chip">
                  {c}
                </Link>
              ))}
            </div>
          </div>
          <div className="hero-art">
            <Link href="/places" className="btn">
              Open the full map
            </Link>
          </div>
        </div>
      </section>

      <div className="wrap section" style={{ paddingTop: 40 }}>
        <div className="cats">
          {CATEGORIES.map((c) => (
            <Link key={c} href="/places" className="cat">
              <i aria-hidden="true" />
              {c}
            </Link>
          ))}
        </div>
      </div>

      <section className="wrap section">
        <div className="between">
          <h2 className="sub">Top rated near you</h2>
          <Link href="/places" style={{ fontWeight: 600 }}>
            See all on the map
          </Link>
        </div>
        {top.length ? (
          <div className="row">{top.map((v) => <VenueCard key={v.id} v={v} />)}</div>
        ) : (
          <div className="empty">Places are on their way. Add venues in Contentful and they will show up here.</div>
        )}
      </section>

      <section className="wrap section">
        <div className="between">
          <h2 className="sub">Local news</h2>
          <Link href="/news" style={{ fontWeight: 600 }}>
            All news
          </Link>
        </div>
        {lead ? (
          <div className="row" style={{ gap: 24 }}>
            <a href={lead.sourceUrl ?? "/news"} className="card news-feature" {...(lead.sourceUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              <NewsThumb n={lead} className="card-img" width={1000} />
              <div className="card-body">
                <div className="topic">{lead.topic}</div>
                <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>{lead.title}</div>
                <div className="small muted">
                  {lead.sourceName ? `${lead.sourceName} · ` : ""}
                  {timeAgo(lead.publishedAt)}
                </div>
                {lead.sourceUrl ? <div className="ext">Read on {lead.sourceName ?? "the publisher\u2019s site"} <span aria-hidden="true">\u2197</span> <span className="sr">(opens in a new tab)</span></div> : null}
              </div>
            </a>
            <div className="news-list">
              {more.map((n) => (
                <a key={n.id} href={n.sourceUrl ?? "/news"} className="news-item" {...(n.sourceUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <NewsThumb n={n} className="thumb" width={300} />
                  <div style={{ minWidth: 0 }}>
                    <div className="topic">{n.topic}</div>
                    <div style={{ fontWeight: 600 }}>{n.title}</div>
                    <div className="small muted">
                      {n.sourceName ? `${n.sourceName} · ` : ""}
                      {timeAgo(n.publishedAt)}
                    </div>
                    {n.sourceUrl ? <div className="ext">Read on {n.sourceName ?? "the publisher\u2019s site"} <span aria-hidden="true">\u2197</span> <span className="sr">(opens in a new tab)</span></div> : null}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty">No news right now. Check back soon.</div>
        )}
      </section>

      <section className="wrap section">
        <div className="between">
          <h2 className="sub">What&apos;s on this week</h2>
          <Link href="/news#whats-on" style={{ fontWeight: 600 }}>
            Full calendar
          </Link>
        </div>
        {events.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {events.slice(0, 4).map((e) => (
              <a key={e.id} href={e.link ?? "/news#whats-on"} className="event">
                <div className="date">
                  <span>{dayShort(e.startsAt)}</span>
                  <b>{dayNum(e.startsAt)}</b>
                </div>
                <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                  <div className="card-title">{e.title}</div>
                  <div className="small muted">
                    {[e.venueName, timeShort(e.startsAt), e.price].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="empty">No upcoming events yet. Add events in Contentful.</div>
        )}
      </section>

      <section className="wrap section">
        <div className="teaser">
          <div>
            <h2 className="sub">Local deals are coming</h2>
            <p className="muted">Exclusive discount codes from SW18 pubs, cafés and shops. Get notified when the first ones go live.</p>
          </div>
          <div>
            <LeadForm
              formName="waitlist"
              fields={[{ name: "email", label: "Your email", type: "email" }]}
              button="Notify me"
              done="Thanks, we will let you know."
            />
          </div>
        </div>
      </section>
    </>
  );
}
