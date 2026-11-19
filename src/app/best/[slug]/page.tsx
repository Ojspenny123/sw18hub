import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import VenueRow from "@/components/VenueRow";
import { getVenues } from "@/lib/contentful";
import { byRating, withRatings } from "@/lib/google";
import { abs, bestCombos, bestSlug, bestTitle, breadcrumbJsonLd, parseBestSlug, typePlural } from "@/lib/seo";

export const revalidate = 300;

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
type Ranked = { name: string; google?: { rating?: number; count?: number } }[];

function intro(type: string, area: string | undefined, ranked: Ranked) {
  return `SW18 Hub lists ${ranked.length} ${typePlural(type)} in ${where(area)}, in alphabetical order.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Not found", robots: { index: false } };
  const title = bestTitle(data.type, data.area);
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

  const faqs: [string, string][] = [
    [`How many ${t} are there in ${where(area)}?`, `SW18 Hub currently lists ${ranked.length} ${t} in ${where(area)}.`],
    [`How are these ${t} ordered?`, "Alphabetically. SW18 Hub does not rank places by rating."],
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
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/places">Places</Link>
        <span aria-hidden="true">/</span>
        <span>{title}</span>
      </nav>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 className="title">{title}</h1>
        <p style={{ maxWidth: "70ch" }}>{intro(type, area, ranked)}</p>
        <p className="small muted">Photos are credited to their owners.</p>
      </div>

      <ol className="ranked">
        {ranked.map((v) => (
          <li key={v.id}>
            <VenueRow v={v} />
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
          <h2 className="sub">More lists</h2>
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
