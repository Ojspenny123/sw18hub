import NewsCard from "@/components/NewsCard";
import Link from "next/link";
import VenueCard from "@/components/VenueCard";
import LeadForm from "@/components/LeadForm";
import { getEvents, getNews, getVenues } from "@/lib/contentful";
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
  const [venues, news, events] = await Promise.all([getVenues(), getNews(), getEvents()]);
  const rated = await withRatings(venues);
  const top = [...rated].sort((a, b) => byRating(a, b) || Number(b.featured) - Number(a.featured)).slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="hero-text">
            <h1>Everything happening in SW18</h1>
            <p className="lead">Top-rated places, local news, events and deals for Wandsworth, Earlsfield and Southfields.</p>
            <form action="/ask" className="askbox">
              <label htmlFor="q" className="sr">
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="SW18 Hub" width={460} height={150} />
          </div>
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
