import type { Metadata } from "next";
import { query } from "./contentful";
import { bestSlug, SITE_DESCRIPTION } from "./seo";

/**
 * Pages are built from a heading, an intro and three zones (top, middle, bottom) of blocks.
 * Contentful (sw18Page + sw18Block) controls the text and the order. The defaults below are used when a page
 * has not been set up in Contentful yet, so the site never breaks if Contentful is empty or slow.
 */
export type BlockType =
  | "Hero feature" | "Coming up" | "Ask panel" | "Run clubs panel" | "Places showcase" | "News list" | "Newsletter signup"
  | "Featured list" | "Events explorer" | "Call to action" | "Run clubs list" | "Places explorer" | "News feed" | "Events panel" | "Ask chat" | "Text section";
export type Width = "Full" | "Main" | "Side" | "Half";

export interface Block {
  id: string;
  name: string;
  type: BlockType;
  heading?: string;
  level: 2 | 3;
  body?: string;
  linkLabel?: string;
  linkUrl?: string;
  count?: number;
  links: { label: string; href: string }[];
  width: Width;
}
export type PageSlug = "home" | "whats-on" | "run-clubs" | "places" | "news" | "ask" | "about";
export interface PageData {
  slug: PageSlug;
  h1: string;
  hideH1: boolean;
  intro?: string;
  seoTitle: string;
  seoDescription: string;
  top: Block[];
  middle: Block[];
  bottom: Block[];
}

let n = 0;
const b = (type: BlockType, p: Partial<Block> = {}): Block => ({ id: `d${n++}`, name: type, type, level: 2, links: [], width: "Full", ...p });

const CHIPS = [
  { label: "Eat", href: `/best/${bestSlug("Restaurant")}` },
  { label: "Drink", href: `/best/${bestSlug("Pub")}` },
  { label: "Coffee", href: `/best/${bestSlug("Cafe")}` },
  { label: "What is on this weekend?", href: "/whats-on" },
];
const SIGNUP = "Thanks, see you on Sunday.";

const D = (slug: PageSlug, p: Omit<PageData, "slug" | "top" | "middle" | "bottom" | "hideH1"> & Partial<Pick<PageData, "top" | "middle" | "bottom" | "hideH1">>): PageData => ({
  slug, hideH1: false, top: [], middle: [], bottom: [], ...p,
});

export const DEFAULT_PAGES: Record<PageSlug, PageData> = {
  home: D("home", {
    h1: "SW18 Hub: what's on, run clubs, places to eat and drink and local news in Wandsworth, Earlsfield and Southfields",
    hideH1: true,
    seoTitle: "SW18 Hub: what's on, run clubs, places and news in Wandsworth",
    seoDescription: SITE_DESCRIPTION,
    top: [b("Hero feature", { heading: "New in SW18", linkLabel: "Find out more →" })],
    middle: [
      b("Coming up", { heading: "Coming up", linkLabel: "Full calendar", linkUrl: "/whats-on", count: 6, width: "Main" }),
      b("Ask panel", { heading: "Ask SW18", body: "Ask anything about the area, for example dog-friendly pubs with a garden.", links: CHIPS, width: "Side" }),
      b("Run clubs panel", { heading: "Run clubs", linkLabel: "All run clubs", linkUrl: "/run-clubs", count: 2, width: "Side" }),
      b("Places showcase", { heading: "Places we like", linkLabel: "See all on the map", linkUrl: "/places", count: 4 }),
      b("News list", { heading: "Local news", linkLabel: "All news", linkUrl: "/news", count: 3 }),
    ],
    bottom: [
      b("Newsletter signup", {
        heading: "The Sunday round-up",
        body: "One email a week with what is on, local news and, soon, deals from SW18 pubs and cafes.",
        linkLabel: "Sign me up",
      }),
    ],
  }),
  "whats-on": D("whats-on", {
    h1: "What's on in SW18",
    intro:
      "Quiz nights, markets, classes and community events in Wandsworth Town, Earlsfield, Southfields and Wandsworth Common, plus nearby weekly events like parkruns in Tooting, Battersea, Clapham and Fulham. Each one links to the organiser for tickets and details.",
    seoTitle: "What's on in SW18: events in Wandsworth, Earlsfield and Southfields",
    seoDescription: "Upcoming events, quiz nights, markets and things to do in SW18, listed by date with links to the organisers.",
    top: [b("Featured list", { heading: "Featured" })],
    middle: [b("Events explorer")],
    bottom: [b("Call to action", { heading: "Running an event in SW18?", body: "Tell us and we'll add it. It's free to be listed.", linkLabel: "Tell us about it", linkUrl: "/deals#business" })],
  }),
  "run-clubs": D("run-clubs", {
    h1: "Run clubs in SW18",
    intro: "Weekly run clubs in Wandsworth and nearby. Looking for parkrun? See [What's on](/whats-on).",
    seoTitle: "Run clubs in SW18: Wandsworth, Earlsfield, Southfields and nearby",
    seoDescription: "Free and friendly run clubs in and around SW18, with when and where they meet and a link to each club.",
    middle: [b("Run clubs list", { body: "Regular run clubs in and around SW18. Times can change, so check the club's page before you go." })],
  }),
  places: D("places", {
    h1: "Places to eat and drink in SW18",
    intro: "{count} cafes, restaurants, bars, pubs and takeaways in Wandsworth Town, Earlsfield and Southfields, all in one list.",
    seoTitle: "Places to eat and drink in SW18",
    seoDescription: "Every cafe, restaurant, bar, pub and takeaway in Wandsworth Town, Earlsfield and Southfields in one place, listed A to Z. Filter by area, type and features.",
    middle: [b("Places explorer")],
  }),
  news: D("news", {
    h1: "SW18 local news",
    seoTitle: "SW18 local news and what's on",
    seoDescription: "Latest local news for Wandsworth, Earlsfield and Southfields from trusted local sources, plus events and things to do in SW18.",
    middle: [b("News feed")],
    bottom: [
      b("Events panel", { heading: "What's on", linkLabel: "See all events", linkUrl: "/whats-on", count: 5, width: "Half" }),
      b("Newsletter signup", { heading: "Weekly SW18 round-up", body: "News, events and new places in one email.", linkLabel: "Subscribe", width: "Half" }),
    ],
  }),
  ask: D("ask", {
    h1: "Ask SW18",
    seoTitle: "Ask SW18",
    seoDescription: "Ask a question about places to eat and drink, news, events and deals in Wandsworth, Earlsfield and Southfields.",
    middle: [b("Ask chat")],
  }),
  about: D("about", {
    h1: "About SW18 Hub",
    seoTitle: "About SW18 Hub: how places are chosen, and where the data comes from",
    seoDescription: "SW18 Hub is an independent local guide to Wandsworth Town, Earlsfield and Southfields. How places are chosen and how often data is refreshed.",
    middle: [
      b("Text section", {
        body: "SW18 Hub is an independent local guide to SW18 in south-west London: Wandsworth Town, Earlsfield, Southfields and Wandsworth Common. It is run by a local resident and is not paid for by the places it lists.",
      }),
      b("Text section", {
        heading: "How places are chosen",
        body: "We list independent and chain cafes, restaurants, bars, pubs and takeaways inside SW18 that are open and well regarded locally. Places can be suggested through the [Ask SW18](/ask) page.",
      }),
      b("Text section", {
        heading: "Where the data comes from and how often it updates",
        body: "Place details are written and checked by hand. Events and news are refreshed once a week, every Sunday. Opening times may be out of date, so please check with the venue.\n\nLocal news headlines link out to the original publishers, who keep all rights to their stories.",
      }),
      b("Text section", { heading: "Explore", body: "[Map of all places](/places) · [Local news](/news) · [Ask SW18](/ask)" }),
    ],
  }),
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const WIDTHS = ["Full", "Main", "Side", "Half"];
function toBlock(e: { sys: { id: string }; fields: Record<string, any> }): Block | undefined {
  const f = e.fields;
  if (!f?.blockType) return undefined;
  const links = ((f.links as string[] | undefined) ?? [])
    .map((s) => s.split("|").map((x) => x.trim()))
    .filter((p) => p[0] && p[1])
    .map(([label, href]) => ({ label, href }));
  return {
    id: e.sys.id,
    name: f.internalName || f.blockType,
    type: f.blockType,
    heading: f.heading || undefined,
    level: f.headingLevel === "H3" ? 3 : 2,
    body: f.body || undefined,
    linkLabel: f.linkLabel || undefined,
    linkUrl: f.linkUrl || undefined,
    count: typeof f.itemCount === "number" ? f.itemCount : undefined,
    links,
    width: WIDTHS.includes(f.width) ? f.width : "Full",
  };
}

/** The page from Contentful, or the built-in default if it has not been set up there (or Contentful is down). */
export async function getPage(slug: PageSlug): Promise<PageData> {
  const def = DEFAULT_PAGES[slug];
  try {
    const r = await query("sw18Page", { "fields.slug": slug, limit: "1" });
    const e = r.items[0];
    if (!e) return def;
    const zone = (key: string): Block[] =>
      ((e.fields[key] as any[] | undefined) ?? []).map((l) => r.entry(l)).filter(Boolean).map((x) => toBlock(x!)).filter((x): x is Block => Boolean(x));
    return {
      slug,
      h1: e.fields.h1 || def.h1,
      hideH1: Boolean(e.fields.hideH1),
      intro: e.fields.intro ?? undefined,
      seoTitle: e.fields.seoTitle || def.seoTitle,
      seoDescription: e.fields.seoDescription || def.seoDescription,
      top: zone("top"),
      middle: zone("middle"),
      bottom: zone("bottom"),
    };
  } catch {
    return def;
  }
}

export function pageMetadata(p: PageData, path: string, absolute = false): Metadata {
  return {
    title: absolute ? { absolute: p.seoTitle } : p.seoTitle,
    description: p.seoDescription,
    alternates: { canonical: path },
    openGraph: { title: p.seoTitle, description: p.seoDescription, url: path, type: "website", siteName: "SW18 Hub", locale: "en_GB" },
    twitter: { card: "summary_large_image", title: p.seoTitle, description: p.seoDescription },
  };
}

/** Header and footer text. One `sw18SiteSettings` entry in Contentful; these defaults are used if it is missing. */
export interface SiteSettings {
  siteName: string;
  tagline: string;
  stripText: string;
  navLinks: { label: string; href: string }[];
  askLabel: string;
  askUrl: string;
  footerText: string;
  footerLinks: { label: string; href: string }[];
}
export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "SW18 Hub",
  tagline: "What's on, run clubs, places to eat and drink and local news in SW18",
  stripText: "Wandsworth Town, Earlsfield, Southfields, Wandsworth Common",
  navLinks: [
    { label: "Home", href: "/" },
    { label: "What's on", href: "/whats-on" },
    { label: "Run clubs", href: "/run-clubs" },
    { label: "Places", href: "/places" },
    { label: "News", href: "/news" },
  ],
  askLabel: "Ask SW18",
  askUrl: "/ask",
  footerText: "A local guide to Wandsworth Town, Earlsfield, Southfields and Wandsworth Common. Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.",
  footerLinks: [
    { label: "About", href: "/about" },
    { label: "Run clubs", href: "/run-clubs" },
    { label: "Add your business", href: "/deals#business" },
    { label: "Privacy and cookies", href: "/privacy" },
  ],
};

const parseLinks = (v: unknown, fallback: { label: string; href: string }[]) => {
  const out = (Array.isArray(v) ? (v as string[]) : [])
    .map((s) => s.split("|").map((x) => x.trim()))
    .filter((p) => p[0] && p[1])
    .map(([label, href]) => ({ label, href }));
  return out.length ? out : fallback;
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const f = (await query("sw18SiteSettings", { limit: "1" })).items[0]?.fields;
    if (!f) return DEFAULT_SETTINGS;
    const d = DEFAULT_SETTINGS;
    return {
      siteName: f.siteName || d.siteName,
      tagline: f.tagline || d.tagline,
      stripText: f.stripText ?? d.stripText,
      navLinks: parseLinks(f.navLinks, d.navLinks),
      askLabel: f.askLabel || d.askLabel,
      askUrl: f.askUrl || d.askUrl,
      footerText: f.footerText ?? d.footerText,
      footerLinks: parseLinks(f.footerLinks, d.footerLinks),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** The feedback survey. One `sw18Survey` entry in Contentful; if there is none (or it is switched off) no survey shows. */
export interface Survey {
  question: string;
  lowLabel: string;
  highLabel: string;
  followUp: string;
  placeholder: string;
  thanks: string;
  delaySeconds: number;
}
export async function getSurvey(): Promise<Survey | undefined> {
  try {
    const f = (await query("sw18Survey", { limit: "1" })).items[0]?.fields;
    if (!f || !f.active) return undefined;
    return {
      question: f.question || "How is your experience of SW18 Hub today?",
      lowLabel: f.lowLabel || "Poor",
      highLabel: f.highLabel || "Great",
      followUp: f.followUp || "Anything you'd like to tell us?",
      placeholder: f.placeholder || "A few words (max 50 characters)",
      thanks: f.thanks || "Thanks for your feedback.",
      delaySeconds: typeof f.delaySeconds === "number" ? f.delaySeconds : 5,
    };
  } catch {
    return undefined;
  }
}
