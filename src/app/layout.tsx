import { NEARBY_AREAS, SW18_AREAS } from "@/lib/types";
import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlockDebug from "@/components/BlockDebug";
import { getSiteSettings, getSurvey } from "@/lib/pages";
import SurveyPopup from "@/components/SurveyPopup";
import Analytics from "@/components/Analytics";
import PopupModal from "@/components/PopupModal";
import { getPopups } from "@/lib/contentful";
import JsonLd from "@/components/JsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, abs } from "@/lib/seo";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "SW18 Hub: what's on, run clubs, places and news in Wandsworth", template: "%s | SW18 Hub" },
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
    areaServed: [...SW18_AREAS.map((n) => `${n}, London SW18`), ...NEARBY_AREAS.map((n) => `${n}, London`)].map((name) => ({ "@type": "Place", name })),
  },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [popups, settings, survey] = await Promise.all([getPopups(), getSiteSettings(), getSurvey()]);
  return (
    <html lang="en-GB">
      <head>
        <JsonLd data={siteJsonLd} />
      </head>
      <body>
        <a href="#main" className="skip">Skip to main content</a>
        <Header s={settings} />
        <main id="main" tabIndex={-1}>{children}</main>
        <Footer s={settings} />
        <PopupModal popups={popups} />
        <Analytics />
        <BlockDebug />
        {survey ? <SurveyPopup survey={survey} /> : null}
      </body>
    </html>
  );
}
