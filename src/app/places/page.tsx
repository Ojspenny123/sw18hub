import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PageView from "@/components/PageView";
import { getPage, pageMetadata } from "@/lib/pages";
import { getVenues } from "@/lib/contentful";
import { withRatings } from "@/lib/google";
import { abs } from "@/lib/seo";

export const revalidate = 300;


export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPage("places"), "/places");
}

export default async function PlacesPage() {
  const venues = await withRatings(await getVenues());
  const top = venues.slice(0, 20);
  return (
    <PageView page={await getPage("places")}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Places to eat and drink in SW18",
          itemListElement: top.map((v, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/places/${v.slug}`), name: v.name })),
        }}
      />
    </PageView>
  );
}
