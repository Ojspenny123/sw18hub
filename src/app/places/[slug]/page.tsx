import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import VenueRow from "@/components/VenueRow";
import { getVenues } from "@/lib/contentful";
import { byRating, withRatings } from "@/lib/google";
import { venueImage } from "@/lib/images";
import { bestSlug, bestTitle, breadcrumbJsonLd, typePlural, venueJsonLd } from "@/lib/seo";

export const revalidate = 300;

/** Pages are built on first visit, then cached and refreshed (incremental static regeneration). */
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const all = await getVenues();
  const base = all.find((v) => v.slug === slug);
  if (!base) return null;
  const rated = await withRatings(all.filter((v) => v.type === base.type || v.id === base.id));
  const venue = rated.find((v) => v.id === base.id)!;
  const peers = rated.filter((v) => v.type === base.type).sort(byRating);
  return { venue, peers };
}

const article = (t: string) => (/^[aeiou]/i.test(t) ? "an" : "a");

function summary(v: NonNullable<Awaited<ReturnType<typeof load>>>["venue"], rank: number, total: number) {
  const g = v.google;
  const parts = [`${v.name} is ${article(v.type)} ${v.type.toLowerCase()} in ${v.area}, SW18, London.`];
  if (g?.rating && g.count) {
    parts.push(`It has a ${g.rating.toFixed(1)} out of 5 rating from ${g.count.toLocaleString("en-GB")} Google reviews, which ranks it number ${rank} of ${total} ${typePlural(v.type)} listed on SW18 Hub.`);
  }
  if (v.address) parts.push(`Address: ${v.address}.`);
  return parts.join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Place not found", robots: { index: false } };
  const { venue: v, peers } = data;
  const rank = peers.findIndex((p) => p.id === v.id) + 1;
  const description = summary(v, rank, peers.length).slice(0, 300);
  const img = v.image ? `${v.image}?w=1200&h=630&fit=fill&fm=jpg` : undefined;
  return {
    title: `${v.name}, ${v.type} in ${v.area} SW18`,
    description,
    alternates: { canonical: `/places/${v.slug}` },
    openGraph: { title: `${v.name} | ${v.area} SW18`, description, url: `/places/${v.slug}`, type: "website", ...(img ? { images: [img] } : {}) },
  };
}

export default async function VenuePage({ params }: Props) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { venue: v, peers } = data;
  const g = v.google;
  const rank = peers.findIndex((p) => p.id === v.id) + 1;
  const img = venueImage(v, 900);
  const nearby = peers.filter((p) => p.id !== v.id && p.area === v.area).slice(0, 4);
  const directions =
    v.lat !== undefined && v.lon !== undefined ? `https://www.openstreetmap.org/directions?to=${v.lat}%2C${v.lon}` : undefined;

  return (
    <div className="wrap section" style={{ paddingTop: 20 }}>
      <JsonLd
        data={[
          venueJsonLd(v),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Places", path: "/places" },
            { name: bestTitle(v.type, v.area), path: `/best/${bestSlug(v.type, v.area)}` },
            { name: v.name, path: `/places/${v.slug}` },
          ]),
        ]}
      />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/places">Places</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/best/${bestSlug(v.type, v.area)}`}>{bestTitle(v.type, v.area)}</Link>
      </nav>

      <div className="venue-hero">
        <div>
          <div className="photo venue-photo" style={img ? { backgroundImage: `url(${img})`, height: undefined } : undefined} role="img" aria-label={`Photo of ${v.name}`} />
          {!v.image && v.photo ? (
            <p className="credit" style={{ marginTop: 6 }}>
              {v.photo.page ? <a href={v.photo.page} target="_blank" rel="noopener noreferrer">{v.photo.credit}</a> : v.photo.credit}
            </p>
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 className="title">{v.name}</h1>
          <div className="facts">
            <span className="tag">{v.type}</span>
            <span className="tag">{v.area}</span>
            {v.features.map((f) => (
              <span key={f} className="tag">{f}</span>
            ))}
          </div>
          {g?.rating ? (
            <p>
              <span className="rating" style={{ fontSize: 22 }}>★ {g.rating.toFixed(1)}</span>{" "}
              <span className="muted">from {g.count?.toLocaleString("en-GB")} Google reviews</span>
              {g.openNow !== undefined ? <span className={g.openNow ? "status-open" : "status-closed"}> · {g.openNow ? "Open now" : "Closed now"}</span> : null}
            </p>
          ) : null}
          <p>{summary(v, rank, peers.length)}</p>
          {v.description ? <p className="muted">{v.description}</p> : null}
          {v.highlights?.length ? (
            <div>
              <h2 className="sub" style={{ fontSize: 16, marginBottom: 6 }}>Good to know</h2>
              <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4 }}>
                {v.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="actions">
            {directions ? (
              <a className="btn" href={directions} target="_blank" rel="noopener noreferrer">
                Directions <span className="sr">(opens OpenStreetMap in a new tab)</span>
              </a>
            ) : null}
            {v.website ? (
              <a className="btn outline" href={v.website} target="_blank" rel="noopener noreferrer">
                Website <span className="sr">(opens in a new tab)</span>
              </a>
            ) : null}
          </div>
          {v.openingHours ? (
            <p className="small">
              <strong>Opening hours</strong>
              <br />
              {v.openingHours.split(";").map((h) => (
                <span key={h}>
                  {h.trim()}
                  <br />
                </span>
              ))}
            </p>
          ) : null}
          {v.phone ? (
            <p className="small">
              Phone: <a href={`tel:${v.phone.replace(/\s/g, "")}`}>{v.phone}</a>
            </p>
          ) : null}
          <p className="small muted">Opening hours and map position from OpenStreetMap contributors, so check with the venue.</p>
        </div>
      </div>

      {nearby.length ? (
        <section className="section" style={{ paddingTop: 16 }}>
          <div className="between">
            <h2 className="sub">More {typePlural(v.type)} in {v.area}</h2>
            <Link className="more-link" href={`/best/${bestSlug(v.type, v.area)}`}>See the full ranking</Link>
          </div>
          <div className="venue-list">
            {nearby.map((p) => (
              <VenueRow key={p.id} v={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
