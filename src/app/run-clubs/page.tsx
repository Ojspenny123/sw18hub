import type { Metadata } from "next";
import PageView from "@/components/PageView";
import { getPage, pageMetadata } from "@/lib/pages";
import JsonLd from "@/components/JsonLd";
import { RUN_CLUBS } from "@/lib/recurring";
import { abs } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPage("run-clubs"), "/run-clubs");
}

export default async function RunClubsPage() {
  return (
    <PageView page={await getPage("run-clubs")}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Run clubs in SW18",
          url: abs("/run-clubs"),
          itemListElement: RUN_CLUBS.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: { "@type": "SportsOrganization", name: c.name, description: c.description, url: c.link, sport: "Running", location: { "@type": "Place", name: c.place, address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" } } },
          })),
        }}
      />
    </PageView>
  );
}
