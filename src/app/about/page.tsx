import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { abs } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About SW18 Hub: how places are chosen, and where the data comes from",
  description: "SW18 Hub is an independent local guide to Wandsworth Town, Earlsfield and Southfields. How places are chosen and how often data is refreshed.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About SW18 Hub: how places are chosen, and where the data comes from", description: "SW18 Hub is an independent local guide to Wandsworth Town, Earlsfield and Southfields. How places are chosen and how often data is refreshed.", url: "/about", type: "website", siteName: "SW18 Hub", locale: "en_GB" },
  twitter: { card: "summary_large_image", title: "About SW18 Hub: how places are chosen, and where the data comes from", description: "SW18 Hub is an independent local guide to Wandsworth Town, Earlsfield and Southfields. How places are chosen and how often data is refreshed." },
};

export default function AboutPage() {
  return (
    <div className="wrap section" style={{ paddingTop: 24 }}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: abs("/about"),
          name: "About SW18 Hub",
          about: { "@id": abs("/#org") },
        }}
      />
      <h1 className="title">About SW18 Hub</h1>
      <div className="prose">
        <p>SW18 Hub is an independent local guide to SW18 in south-west London: Wandsworth Town, Earlsfield, Southfields and Wandsworth Common. It is run by a local resident and is not paid for by the places it lists.</p>
        <h2>How places are chosen</h2>
        <p>We list independent and chain cafes, restaurants, bars, pubs and takeaways inside SW18 that are open and well regarded locally. Places can be suggested through the Ask SW18 page.</p>
        <h2>Where the data comes from and how often it updates</h2>
        <p>Place details are written and checked by hand. Events and news are refreshed once a week, every Sunday. Opening times may be out of date, so please check with the venue.</p>
        <p>Local news headlines link out to the original publishers, who keep all rights to their stories.</p>
        <h2>Explore</h2>
        <p>
          <Link href="/places">Map of all places</Link> · <Link href="/news">Local news</Link> · <Link href="/ask">Ask SW18</Link>
        </p>
      </div>
    </div>
  );
}
