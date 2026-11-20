import { osmFor } from "./osm";
import { photoFor } from "./venue-images";
import type { Deal, EventItem, NewsArticle, Popup, Venue } from "./types";
import { getRecurringEvents } from "./recurring";
import { getFeedEvents } from "./events";
import { getRssNews } from "./rss";

const SPACE = process.env.CONTENTFUL_SPACE_ID;
const ENV = process.env.CONTENTFUL_ENVIRONMENT || "master";
const TOKEN = process.env.CONTENTFUL_DELIVERY_TOKEN;

export const contentfulConfigured = Boolean(SPACE && TOKEN);

/**
 * SW18 Hub shares a Contentful space with another site, so it only ever reads its own `sw18*` content types
 * and entries tagged `siteSw18Hub`. Never read types that start with `mc` (The Messy Chef).
 */
export const CONTENT_TYPES = {
  venue: "sw18Venue",
  event: "sw18Event",
  news: "sw18NewsArticle",
  business: "sw18Business",
  deal: "sw18Deal",
  popup: "sw18Popup",
  page: "sw18Page",
  block: "sw18Block",
} as const;
export const SITE_TAG = "siteSw18Hub";
/** Contentful responses are cached until a publish webhook hits /api/revalidate-content (24h is only a safety net). */
export const CONTENTFUL_CACHE_TAG = "contentful";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CfEntry {
  sys: { id: string; updatedAt?: string };
  fields: Record<string, any>;
}
interface CfResponse {
  items: CfEntry[];
  includes?: { Asset?: any[]; Entry?: CfEntry[] };
}

interface Result {
  items: CfEntry[];
  asset: (link?: any) => string | undefined;
  entry: (link?: any) => CfEntry | undefined;
}

export async function query(contentType: string, params: Record<string, string> = {}): Promise<Result> {
  const empty: Result = { items: [], asset: () => undefined, entry: () => undefined };
  if (!contentfulConfigured) return empty;

  const url = new URL(`https://cdn.contentful.com/spaces/${SPACE}/environments/${ENV}/entries`);
  url.searchParams.set("content_type", contentType);
  url.searchParams.set("include", "2");
  url.searchParams.set("limit", "200");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const get = (u: URL) => fetch(u, { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 24 * 60 * 60, tags: [CONTENTFUL_CACHE_TAG] } });

  try {
    // Belt and braces: the type prefix already keeps us on our own content; the tag filter adds a second check.
    const tagged = new URL(url);
    tagged.searchParams.set("metadata.tags.sys.id[in]", SITE_TAG);
    let res = await get(tagged);
    let data = res.ok ? ((await res.json()) as CfResponse) : undefined;
    if (res.ok && data && data.items.length === 0) {
      // Nothing carries the tag (for example entries tagged but not yet republished): fall back to the type alone.
      const untagged = await get(url);
      if (untagged.ok) {
        res = untagged;
        data = (await untagged.json()) as CfResponse;
        if (data.items.length) console.warn(`Contentful ${contentType}: no entries tagged ${SITE_TAG}; using the type only`);
      }
    }
    if (!res.ok || !data) {
      console.error(`Contentful ${contentType} request failed: ${res.status}`);
      return empty;
    }
    const assets = new Map<string, string>();
    for (const a of data.includes?.Asset ?? []) {
      const file = a.fields?.file?.url as string | undefined;
      if (file) assets.set(a.sys.id, file.startsWith("//") ? `https:${file}` : file);
    }
    const entries = new Map<string, CfEntry>();
    for (const e of data.includes?.Entry ?? []) entries.set(e.sys.id, e);
    return {
      items: data.items,
      asset: (link) => (link?.sys?.id ? assets.get(link.sys.id) : undefined),
      entry: (link) => (link?.sys?.id ? entries.get(link.sys.id) : undefined),
    };
  } catch (err) {
    console.error(`Contentful ${contentType} request error`, err);
    return empty;
  }
}

export async function getVenues(): Promise<Venue[]> {
  const r = await query(CONTENT_TYPES.venue, { order: "fields.name" });
  return r.items.map((e) => ({
    id: e.sys.id,
    name: e.fields.name,
    slug: e.fields.slug,
    type: e.fields.venueType,
    area: e.fields.area,
    googlePlaceId: e.fields.googlePlaceId,
    address: e.fields.address,
    lat: e.fields.location?.lat ?? osmFor(e.fields.slug)?.lat,
    lon: e.fields.location?.lon ?? osmFor(e.fields.slug)?.lon,
    website: e.fields.website ?? osmFor(e.fields.slug)?.website,
    phone: osmFor(e.fields.slug)?.phone,
    openingHours: osmFor(e.fields.slug)?.openingHours,
    osmUrl: osmFor(e.fields.slug)?.osm,
    photo: photoFor(e.fields.slug, e.fields.name),
    description: e.fields.description,
    features: e.fields.features ?? [],
    highlights: e.fields.highlights ?? [],
    featured: Boolean(e.fields.featured),
    image: r.asset(e.fields.image),
    imageCredit: e.fields.imageCredit,
  }));
}

/** Stories you add by hand in Contentful (featured ones lead), plus the automatic RSS feeds. */
/** Stories we never show: anything about prisons (including HMP Wandsworth). */
const EXCLUDED_NEWS = /\b(prisons?|prisoners?|inmates?|jails?|jailed|HMP|HMYOI|young offenders?|prison officers?)\b/i;

export async function getNews(): Promise<NewsArticle[]> {
  const [own, rss] = await Promise.all([getOwnNews(), getRssNews()]);
  const urls = new Set(own.map((n) => n.sourceUrl).filter(Boolean));
  return [...own, ...rss.filter((n) => !urls.has(n.sourceUrl))]
    .filter((n) => !EXCLUDED_NEWS.test(`${n.title} ${n.summary ?? ""}`))
    .sort(
    (a, b) => Number(b.featured) - Number(a.featured) || b.publishedAt.localeCompare(a.publishedAt),
  );
}

async function getOwnNews(): Promise<NewsArticle[]> {
  const r = await query(CONTENT_TYPES.news, { order: "-fields.publishedAt" });
  return r.items.map((e) => ({
    id: e.sys.id,
    title: e.fields.title,
    slug: e.fields.slug,
    summary: e.fields.summary,
    topic: e.fields.topic,
    sourceName: e.fields.sourceName,
    sourceUrl: e.fields.sourceUrl,
    publishedAt: e.fields.publishedAt,
    image: r.asset(e.fields.image),
    imageCredit: e.fields.imageCredit,
    featured: Boolean(e.fields.featured),
    sw18: true, // added by hand, so it is local by definition
  }));
}

async function getContentfulEvents(): Promise<EventItem[]> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const r = await query(CONTENT_TYPES.event, {
    order: "fields.startsAt",
    "fields.startsAt[gte]": startOfToday.toISOString(),
  });
  return r.items.map((e) => ({
    id: e.sys.id,
    title: e.fields.title,
    slug: e.fields.slug,
    description: e.fields.description,
    startsAt: e.fields.startsAt,
    endsAt: e.fields.endsAt,
    venueName: r.entry(e.fields.venue)?.fields.name ?? e.fields.locationName,
    price: e.fields.price,
    link: e.fields.link,
    image: r.asset(e.fields.image),
    imageCredit: e.fields.imageCredit,
  }));
}

/** Hand-added Contentful events first, then the weekly calendar feeds; duplicates (same title and day) dropped. */
export async function getEvents(): Promise<EventItem[]> {
  const [mine, feed] = await Promise.all([getContentfulEvents(), getFeedEvents()]);
  const key = (e: EventItem) => `${e.title.toLowerCase()}|${e.startsAt.slice(0, 10)}`;
  const have = new Set(mine.map(key));
  const now = Date.now();
  // Long-running events (exhibitions) sort by today rather than their past start date.
  const when = (e: EventItem) => Math.max(Date.parse(e.startsAt), now);
  const weekly = getRecurringEvents().filter((e) => !have.has(key(e)));
  return [...mine, ...feed.filter((e) => !have.has(key(e))), ...weekly].sort((a, b) => when(a) - when(b));
}

export async function getDeals(): Promise<Deal[]> {
  const today = new Date().toISOString().slice(0, 10);
  const r = await query(CONTENT_TYPES.deal, { order: "-sys.createdAt" });
  return r.items
    .map((e) => {
      const b = r.entry(e.fields.business);
      return {
        id: e.sys.id,
        headline: e.fields.headline,
        slug: e.fields.slug,
        businessName: b?.fields.name ?? "Local business",
        category: b?.fields.category,
        area: b?.fields.area,
        discountText: e.fields.discountText,
        code: e.fields.code,
        terms: e.fields.terms,
        validFrom: e.fields.validFrom,
        validTo: e.fields.validTo,
        image: r.asset(e.fields.image),
      } as Deal;
    })
    .filter((d) => (!d.validTo || d.validTo.slice(0, 10) >= today) && (!d.validFrom || d.validFrom.slice(0, 10) <= today));
}

const safeUrl = (u: unknown) => (typeof u === "string" && /^(https:\/\/|\/)/.test(u) ? u : undefined);

async function popupEntries(): Promise<Popup[]> {
  const r = await query(CONTENT_TYPES.popup, { order: "-sys.updatedAt" });
  return r.items
    .filter((e) => e.fields.heading && e.fields.body)
    .map((e) => ({
      id: e.sys.id,
      version: String(e.sys.updatedAt ?? ""),
      heading: e.fields.heading,
      body: e.fields.body,
      detail: e.fields.detail,
      slug: e.fields.slug,
      imageUrl: safeUrl(e.fields.imageUrl),
      imageCredit: e.fields.imageCredit,
      pageText: e.fields.pageText,
      linkLabel: e.fields.linkLabel,
      linkUrl: safeUrl(e.fields.linkUrl),
      showFrom: e.fields.showFrom,
      showUntil: e.fields.showUntil,
      showOnDays: e.fields.showOnDays,
      frequency: e.fields.frequency ?? "Once per visit",
      active: e.fields.active === true,
    }));
}

/** Pop-ups switched on in Contentful, newest edit first. The browser decides which one (if any) to show today. */
export async function getPopups(): Promise<Popup[]> {
  return (await popupEntries()).filter((p) => p.active);
}

/** The page a pop-up links to. Works even after the pop-up is switched off, so old links keep working. */
export async function getPopupPage(slug: string): Promise<Popup | undefined> {
  return (await popupEntries()).find((p) => p.slug === slug);
}
