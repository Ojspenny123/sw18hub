import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PlacesExplorer from "@/components/PlacesExplorer";
import { getVenues } from "@/lib/contentful";
import { withRatings } from "@/lib/google";
import { abs } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Places to eat and drink in SW18",
  description: "Every cafe, restaurant, bar, pub and takeaway in Wandsworth Town, Earlsfield and Southfields in one place, listed A to Z. Filter by area, type and features.",
  alternates: { canonical: "/places" },
  openGraph: { title: "Places to eat and drink in SW18", description: "Every cafe, restaurant, bar, pub and takeaway in Wandsworth Town, Earlsfield and Southfields in one place, listed A to Z. Filter by area, type and features.", url: "/places", type: "website", siteName: "SW18 Hub", locale: "en_GB" },
  twitter: { card: "summary_large_image", title: "Places to eat and drink in SW18", description: "Every cafe, restaurant, bar, pub and takeaway in Wandsworth Town, Earlsfield and Southfields in one place, listed A to Z. Filter by area, type and features." },
};

export default async function PlacesPage() {
  const venues = await withRatings(await getVenues());
  const top = venues.slice(0, 20);
  return (
    <div className="wrap section" style={{ paddingTop: 24 }}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Places to eat and drink in SW18",
          itemListElement: top.map((v, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/places/${v.slug}`), name: v.name })),
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 className="title">Places to eat and drink in SW18</h1>
        <p className="muted">{venues.length} cafes, restaurants, bars, pubs and takeaways in Wandsworth Town, Earlsfield and Southfields, all in one list.</p>
      </div>
      {venues.length === 0 ? <div className="empty">No venues yet. Add venues in Contentful and they will appear here.</div> : null}
      <PlacesExplorer venues={venues} />
    </div>
  );
}
