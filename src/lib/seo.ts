import type { VenueWithRating } from "./types";
import { AREAS, VENUE_TYPES } from "./types";

/** Set NEXT_PUBLIC_SITE_URL once you have a custom domain. Netlify provides URL otherwise. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "https://brilliant-bunny-36c3c1.netlify.app").replace(/\/$/, "");
export const SITE_NAME = "SW18 Hub";
export const SITE_DESCRIPTION =
  "Top-rated cafes, restaurants, bars, pubs and takeaways in SW18 (Wandsworth Town, Earlsfield, Southfields and Wandsworth Common), plus local news, events and deals.";

export const abs = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const TYPE_PLURAL: Record<string, string> = { Pub: "pubs", Bar: "bars", Cafe: "cafes", Restaurant: "restaurants", Takeaway: "takeaways" };
const PLURAL_TYPE = Object.fromEntries(Object.entries(TYPE_PLURAL).map(([k, v]) => [v, k]));
const AREA_SLUG = Object.fromEntries(AREAS.map((a) => [slugify(a), a]));

export const typePlural = (t: string) => TYPE_PLURAL[t] ?? `${t.toLowerCase()}s`;

/** /best/cafes-in-earlsfield, /best/restaurants-in-sw18 */
export function bestSlug(type: string, area?: string) {
  return `${typePlural(type)}-in-${area ? slugify(area) : "sw18"}`;
}

export function parseBestSlug(slug: string): { type: string; area?: string } | null {
  const m = /^([a-z]+)-in-([a-z0-9-]+)$/.exec(slug);
  if (!m) return null;
  const type = PLURAL_TYPE[m[1]];
  if (!type) return null;
  if (m[2] === "sw18") return { type };
  const area = AREA_SLUG[m[2]];
  return area ? { type, area } : null;
}

/** Every type/area combination that has at least `min` places. */
export function bestCombos(venues: { type: string; area: string }[], min = 3) {
  const out: { type: string; area?: string; count: number }[] = [];
  for (const type of VENUE_TYPES) {
    const ofType = venues.filter((v) => v.type === type);
    if (ofType.length >= min) out.push({ type, count: ofType.length });
    for (const area of AREAS) {
      const n = ofType.filter((v) => v.area === area).length;
      if (n >= min) out.push({ type, area, count: n });
    }
  }
  return out;
}

export function bestTitle(type: string, area?: string) {
  const t = typePlural(type);
  return `Best ${t} in ${area ?? "SW18"}`;
}

const SCHEMA_TYPE: Record<string, string> = {
  Pub: "BarOrPub",
  Bar: "BarOrPub",
  Cafe: "CafeOrCoffeeShop",
  Restaurant: "Restaurant",
  Takeaway: "FastFoodRestaurant",
};

/** schema.org LocalBusiness-style data for one venue. Ratings are deliberately left out: they are Google's reviews, not ours. */
export function venueJsonLd(v: VenueWithRating) {
  const postcode = v.address?.match(/\b[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}\b/)?.[0];
  const street = v.address?.split(",")[0]?.trim();
  const lat = v.lat ?? v.google?.lat;
  const lon = v.lon ?? v.google?.lon;
  return {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[v.type] ?? "FoodEstablishment",
    "@id": abs(`/places/${v.slug}`) + "#place",
    name: v.name,
    url: abs(`/places/${v.slug}`),
    ...(v.description ? { description: v.description } : {}),
    ...(v.image ? { image: v.image } : {}),
    address: {
      "@type": "PostalAddress",
      ...(street ? { streetAddress: street } : {}),
      addressLocality: v.area === "Wandsworth Town" ? "Wandsworth" : v.area,
      addressRegion: "London",
      ...(postcode ? { postalCode: postcode } : {}),
      addressCountry: "GB",
    },
    ...(lat !== undefined && lon !== undefined ? { geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lon } } : {}),
    ...(v.website ? { sameAs: [v.website] } : {}),
    ...(v.google?.mapsUri ? { hasMap: v.google.mapsUri } : {}),
    ...(v.features.includes("Outdoor seating") || v.features.includes("Garden") ? { amenityFeature: v.features.map((f) => ({ "@type": "LocationFeatureSpecification", name: f, value: true })) } : {}),
    areaServed: { "@type": "Place", name: `${v.area}, SW18, London` },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}
