import NewsCard from "@/components/NewsCard";
import AskBox from "@/components/AskBox";
import Link from "next/link";
import VenueCard from "@/components/VenueCard";
import LeadForm from "@/components/LeadForm";
import { getEvents, getNews, getPopups, getVenues } from "@/lib/contentful";
import { byRating, withRatings } from "@/lib/google";
import EventRow from "@/components/EventRow";
import { bestSlug, SITE_DESCRIPTION } from "@/lib/seo";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "SW18 Hub: best places to eat and drink in Wandsworth, Earlsfield and Southfields" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const CHIPS = ["Best pubs near Earlsfield", "Sunday roast", "What is on this weekend?"];
const CATEGORIES: [string, string][] = [["Restaurants", "Restaurant"], ["Cafes", "Cafe"], ["Bars", "Bar"], ["Pubs", "Pub"], ["Takeaways", "Takeaway"]];

export default async function Home() {
  const [venues, news, events, popups] = await Promise.all([getVenues(), getNews(), getEvents(), getPopups()]);
  // The newest active featured item with a page and a picture takes the hero art spot; it respects the same dates and days as the pop-up.
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now);
  const dow = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long" }).format(now);
  const feature = popups.find(
    (p) =>
      p.slug &&
      p.imageUrl &&
      !(p.showFrom && today < p.showFrom.slice(0, 10)) &&
      !(p.showUntil && today > p.showUntil.slice(0, 10)) &&
      !(p.showOnDays?.length && !p.showOnDays.includes(dow)),
  );
  const rated = await withRatings(venues);
  const top = [...rated].sort((a, b) => byRating(a, b) || Number(b.featured) - Number(a.featured)).slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="hero-text">
            <h1>Everything happening in SW18</h1>
            <p className="lead">Top-rated places, local news, events and deals for Wandsworth, Earlsfield and Southfields.</p>
            <AskBox />
            <div className="chips">
              {CHIPS.map((c) => (
                <Link key={c} href={`/ask?q=${encodeURIComponent(c)}`} className="chip">
                  {c}
                </Link>
              ))}
            </div>
          </div>
          {feature ? (
            <Link href={`/featured/${feature.slug}`} className="hero-feature">
              <span className="hero-feature-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={feature.imageUrl} alt="" />
              </span>
              <span className="hero-feature-text">
                <span className="hero-feature-k">New in SW18</span>
                <span className="hero-feature-h">{feature.heading}</span>
                {feature.detail ? <span className="hero-feature-d">{feature.detail}</span> : null}
                <span className="popup-more">Find out more →</span>
                {feature.imageCredit ? <span className="hero-feature-c">{feature.imageCredit}</span> : null}
              </span>
            </Link>
          ) : (
            <div className="hero-art">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="SW18 Hub" width={460} height={150} />
            </div>
          )}
        </div>
      </section>

      <div className="wrap section" style={{ paddingTop: 24 }}>
        <nav className="chips" aria-label="Browse by type">
          {CATEGORIES.map(([label, type]) => (
            <Link key={type} href={`/best/${bestSlug(type)}`} className="chip">
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <section className="wrap section">
        <div className="between">
          <h2 className="sub">Top rated near you</h2>
          <Link href="/places" className="more-link">
            See all on the map
          </Link>
        </div>
        {top.length ? (
          <div className="snap">{top.map((v) => <VenueCard key={v.id} v={v} />)}</div>
        ) : (
          <div className="empty">Places are on their way. Add venues in Contentful and they will show up here.</div>
        )}
      </section>

      <section className="wrap section">
        <div className="between">
          <h2 className="sub">Local news</h2>
          <Link href="/news" className="more-link">
            All news
          </Link>
        </div>
        {news.length ? (
          <div className="news-grid">
            {news.slice(0, 4).map((n) => (
              <NewsCard key={n.id} n={n} />
            ))}
          </div>
        ) : (
          <div className="empty">No news right now. Check back soon.</div>
        )}
      </section>

      <section className="wrap section">
        <div className="between">
          <h2 className="sub">What&apos;s on this week</h2>
          <Link href="/whats-on" className="more-link">
            Full calendar
          </Link>
        </div>
        {events.length ? (
          <div className="stack">
            {events.slice(0, 4).map((e) => (
              <EventRow key={e.id} e={e} showType={false} />
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
