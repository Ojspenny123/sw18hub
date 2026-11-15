import type { Metadata } from "next";
import PlacesExplorer from "@/components/PlacesExplorer";
import { getVenues } from "@/lib/contentful";
import { withRatings } from "@/lib/google";

export const revalidate = 60;

export const metadata: Metadata = { title: "Places to eat and drink" };

export default async function PlacesPage() {
  const venues = await withRatings(await getVenues());
  return (
    <div className="wrap section" style={{ paddingTop: 28 }}>
      <h1 className="title">Places to eat and drink</h1>
      {venues.length === 0 ? (
        <div className="empty">No venues yet. Add venues in Contentful and they will appear here.</div>
      ) : null}
      <PlacesExplorer venues={venues} />
    </div>
  );
}
