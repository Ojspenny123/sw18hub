import type { Metadata } from "next";
import Link from "next/link";
import RunClubs from "@/components/RunClubs";
import JsonLd from "@/components/JsonLd";
import { RUN_CLUBS } from "@/lib/recurring";
import { abs } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Run clubs in SW18: Wandsworth, Earlsfield, Southfields and nearby",
  description: "Free and friendly run clubs in and around SW18, with when and where they meet and a link to each club.",
  alternates: { canonical: "/run-clubs" },
  openGraph: { title: "Run clubs in SW18: Wandsworth, Earlsfield, Southfields and nearby", description: "Free and friendly run clubs in and around SW18, with when and where they meet and a link to each club.", url: "/run-clubs", type: "website", siteName: "SW18 Hub", locale: "en_GB" },
  twitter: { card: "summary_large_image", title: "Run clubs in SW18: Wandsworth, Earlsfield, Southfields and nearby", description: "Free and friendly run clubs in and around SW18, with when and where they meet and a link to each club." },
};

export default function RunClubsPage() {
  return (
    <div className="wrap section" style={{ paddingTop: 24 }}>
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
      <h1 className="title">Run clubs in SW18</h1>
      <p className="muted" style={{ margin: "8px 0 20px" }}>
        Weekly run clubs in Wandsworth and nearby. Looking for parkrun? See <Link href="/whats-on">What&apos;s on</Link>.
      </p>
      <RunClubs />
    </div>
  );
}
