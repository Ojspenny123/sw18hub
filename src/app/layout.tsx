import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, abs } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "SW18 Hub: best places to eat and drink in Wandsworth, Earlsfield and Southfields", template: "%s | SW18 Hub" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "./" },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_GB", title: SITE_NAME, description: SITE_DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  other: { "geo.region": "GB-LND", "geo.placename": "Wandsworth, London SW18", ICBM: "51.455, -0.19" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fff94f" };

const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": abs("/#website"),
    url: abs("/"),
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: "en-GB",
    publisher: { "@id": abs("/#org") },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": abs("/#org"),
    name: SITE_NAME,
    url: abs("/"),
    logo: abs("/logo.svg"),
    description: "An independent local guide to SW18 in south-west London.",
    areaServed: ["Wandsworth Town", "Earlsfield", "Southfields", "Wandsworth Common"].map((n) => ({ "@type": "Place", name: `${n}, London SW18` })),
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <JsonLd data={siteJsonLd} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
