import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import VenueRow from "@/components/VenueRow";
import { getVenues } from "@/lib/contentful";
import { byRating, withRatings } from "@/lib/google";
import { abs, bestCombos, bestSlug, bestTitle, breadcrumbJsonLd, parseBestSlug, typePlural } from "@/lib/seo";

export const revalidate = 60;

/** Pages are built on first visit, then cached and refreshed (incremental static regeneration). */
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const parsed = parseBestSlug(slug);
  if (!parsed) return null;
  const all = await getVenues();
  const matches = all.filter((v) => v.type === parsed.type && (!parsed.area || v.area === parsed.area));
  if (matches.length === 0) return null;
  const ranked = (await withRatings(matches)).sort(byRating);
  return { ...parsed, ranked, all };
}

const where = (area?: string) => area ?? "SW18";
const fmt = (v: { name: string; google?: { rating?: number; count?: number } }) =>
  v.google?.rating ? `${v.name} (${v.google.rating.toFixed(1)} from ${v.google.count?.toLocaleString("en-GB")} Google reviews)` : v.name;

type Ranked = { name: string; google?: { rating?: number; count?: number } }[];

function intro(type: string, area: string | undefined, ranked: Ranked) {
  const top = ranked.slice(0, 3);
  const t = typePlural(type);
  if (!top[0]?.google?.rating) return `SW18 Hub lists ${ranked.length} ${t} in ${where(area)}.`;
  const names = top.map(fmt);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  return `The top-ranked ${t} in ${where(area)} are ${list}. SW18 Hub ranks all ${ranked.length} ${t} it lists in ${where(area)} by Google rating, weighted by number of reviews so that a few reviews cannot outrank hundreds.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Not found", robots: { index: false } };
  const title = `${bestTitle(data.type, data.area)} (ranked by Google rating and reviews)`;
  const description = intro(data.type, data.area, data.ranked).slice(0, 300);
  return { title, description, alternates: { canonical: `/best/${slug}` }, openGraph: { title, description, url: `/best/${slug}`, type: "website" } };
}

export default async function BestPage({ params }: Props) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { type, area, ranked, all } = data;
  const t = typePlural(type);
  const title = bestTitle(type, area);
  const mostReviewed = [...ranked].sort((a, b) => (b.google?.count ?? 0) - (a.google?.count ?? 0))[0];

  const faqs: [string, string][] = [
    [`What is the best ${type.toLowerCase()} in ${where(area)}?`, ranked[0]?.google?.rating ? `${fmt(ranked[0])} is ranked top among ${t} in ${where(area)} on SW18 Hub, which weighs Google ratings by the number of reviews.` : `SW18 Hub lists ${ranked.length} ${t} in ${where(area)}.`],
    [`How many ${t} are there in ${where(area)}?`, `SW18 Hub currently lists ${ranked.length} ${t} in ${where(area)}.`],
    ...(mostReviewed?.google?.count ? ([[`Which ${type.toLowerCase()} in ${where(area)} has the most Google reviews?`, `${mostReviewed.name} has the most, with ${mostReviewed.google.count.toLocaleString("en-GB")} Google reviews.`]] as [string, string][]) : []),
    [`How are these ${t} ranked?`, "By Google star rating, weighted by the number of Google reviews, so a 5.0 from a few reviews does not outrank a 4.9 from hundreds. Ratings are refreshed every Sunday."],
  ];

  const otherAreas = bestCombos(all).filter((c) => c.type === type && c.area && c.area !== area);
  const otherTypes = bestCombos(all).filter((c) => c.area === area && c.type !== type);

  return (
    <div className="wrap section" style={{ paddingTop: 20 }}>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: title,
            itemListOrder: "https://schema.org/ItemListOrderDescending",
            numberOfItems: ranked.length,
            itemListElement: ranked.slice(0, 20).map((v, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/places/${v.slug}`), name: v.name })),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Places", path: "/places" },
            { name: title, path: `/best/${slug}` },
          ]),
        ]}
      />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/places">Places</Link>
        <span aria-hidden="true">/</span>
        <span>{title}</span>
      </nav>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 className="title">{title}</h1>
        <p style={{ maxWidth: "70ch" }}>{intro(type, area, ranked)}</p>
        <p className="small muted">Ratings, review counts and photos are from Google and refresh every Sunday.</p>
      </div>

      <ol className="ranked">
        {ranked.map((v, i) => (
          <li key={v.id}>
            <VenueRow v={v} rank={i + 1} />
          </li>
        ))}
      </ol>

      <section className="faq" aria-label="Frequently asked questions">
        <h2 className="sub">Questions</h2>
        {faqs.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>

      {otherAreas.length + otherTypes.length ? (
        <section className="section" style={{ paddingTop: 8 }}>
          <h2 className="sub">More rankings</h2>
          <div className="linkgrid">
            {[...otherAreas, ...otherTypes].map((c) => (
              <Link key={bestSlug(c.type, c.area)} className="chip" href={`/best/${bestSlug(c.type, c.area)}`}>
                {bestTitle(c.type, c.area)}
              </Link>
            ))}
            <Link className="chip" href="/places">Map of all places</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
