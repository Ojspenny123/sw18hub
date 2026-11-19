import NewsRow from "@/components/NewsRow";
import HomePlaces from "@/components/HomePlaces";
import AskBox from "@/components/AskBox";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import { getEvents, getNews, getPopups, getVenues } from "@/lib/contentful";
import { withRatings } from "@/lib/google";
import { dayKey } from "@/lib/event-types";
import { VENUE_TYPES } from "@/lib/types";
import EventCard from "@/components/EventCard";
import { bestSlug, SITE_DESCRIPTION } from "@/lib/seo";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "SW18 Hub: best places to eat and drink in Wandsworth, Earlsfield and Southfields" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const CHIPS: [string, string][] = [
  ["Eat", `/best/${bestSlug("Restaurant")}`],
  ["Drink", `/best/${bestSlug("Pub")}`],
  ["Coffee", `/best/${bestSlug("Cafe")}`],
  ["What is on this weekend?", "/whats-on"],
];

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
  // Four places per type, featured first then A to Z. "All" takes one of each type in turn so it is a mix.
  const pick = (list: typeof rated) => [...list].sort((x, y) => Number(y.featured) - Number(x.featured) || x.name.localeCompare(y.name)).slice(0, 4);
  const byType = VENUE_TYPES.map((type) => ({ type: type as string, venues: pick(rated.filter((v) => v.type === type)) })).filter((g) => g.venues.length);
  const mixed: typeof rated = [];
  for (let i = 0; i < 4; i++) for (const g of byType) if (g.venues[i] && mixed.length < 4) mixed.push(g.venues[i]);
  const groups = [{ type: "All", venues: mixed }, ...byType];
  const todayKey = dayKey(new Date().toISOString());
  const upcoming = events.filter((e) => dayKey(e.endsAt ?? e.startsAt) >= todayKey);
  // Next up: soonest first, each weekly event once, at most three weekly ones so one-off events still show.
  const seenSeries = new Set<string>();
  let weeklyShown = 0;
  const nextUp = upcoming
    .filter((e) => {
      if (!e.series) return true;
      if (seenSeries.has(e.series) || weeklyShown >= 3) return false;
      seenSeries.add(e.series);
      weeklyShown++;
      return true;
    })
    .slice(0, 10);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="hero-text">
            <h1>Everything happening in SW18</h1>
            <p className="lead">Places, local news and events for Wandsworth, Earlsfield and Southfields.</p>
            <AskBox />
            <div className="chips">
              {CHIPS.map(([label, href]) => (
                <Link key={label} href={href} className="chip">
                  {label}
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

      <section className="wrap section">
        <div className="between">
          <h2 className="sub">Next up</h2>
          <Link href="/whats-on" className="more-link">
            All events
          </Link>
        </div>
        {nextUp.length ? (
          <div className="ncards">
            {nextUp.map((e) => (
              <EventCard key={e.id} e={e} todayKey={todayKey} />
            ))}
          </div>
        ) : (
          <div className="empty">No upcoming events yet. Check back soon.</div>
        )}
      </section>

      <section className="wrap section">
        <div className="between">
          <h2 className="sub">Places we like</h2>
          <Link href="/places" className="more-link">
            See all on the map
          </Link>
        </div>
        {mixed.length ? <HomePlaces groups={groups} /> : <div className="empty">Places are on their way. Add venues in Contentful and they will show up here.</div>}
      </section>

      <section className="wrap section">
        <div className="between">
          <h2 className="sub">Local news</h2>
          <Link href="/news" className="more-link">
            All news
          </Link>
        </div>
        {news.length ? (
          <div className="nrows">
            {news.slice(0, 3).map((n) => (
              <NewsRow key={n.id} n={n} />
            ))}
          </div>
        ) : (
          <div className="empty">No news right now. Check back soon.</div>
        )}
      </section>

      <section className="wrap section">
        <div className="teaser">
          <div>
            <h2 className="sub">The Sunday round-up</h2>
            <p className="muted">One email a week with what is on, local news and, soon, deals from SW18 pubs and cafes.</p>
          </div>
          <div>
            <LeadForm
              formName="waitlist"
              fields={[{ name: "email", label: "Your email", type: "email" }]}
              button="Sign me up"
              done="Thanks, see you on Sunday."
            />
          </div>
        </div>
      </section>
    </>
  );
}
