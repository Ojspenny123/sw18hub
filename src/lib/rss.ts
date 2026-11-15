import { XMLParser } from "fast-xml-parser";
import type { NewsArticle } from "./types";

/**
 * Local news from public RSS feeds. Free: no API key, no per-call cost.
 * We show only the headline, a short snippet and a link back to the publisher (never the full article).
 * Feeds are re-fetched at most every 3 hours.
 */
export const NEWS_FEEDS: { name: string; url: string; local?: boolean }[] = [
  { name: "South West Londoner", url: "https://swlondoner.co.uk/tag/wandsworth/feed" },
  { name: "South London News", url: "https://southlondon.co.uk/tag/wandsworth/feed" },
  // `local`: the publisher has already tagged these to Southfields / Wandsworth Town.
  { name: "Putney.news", url: "https://putney.news/category/putney-wards/southfields/feed/", local: true },
  { name: "Putney.news", url: "https://putney.news/category/putney-wards/wandsworth-town/feed/", local: true },
];

const SW18_WORDS =
  /\b(earlsfield|southfields|wandsworth town|wandsworth common|sw18|garratt lane|wandsworth high street|wandsworth bridge|old york road|replingham|tonsleys|wandle|wandsworth park|east hill|point pleasant|merton road)\b/i;

/** True if the text mentions one of our SW18 areas or streets. */
export const mentionsSW18 = (s: string) => SW18_WORDS.test(s);

const REVALIDATE_SECONDS = 3 * 60 * 60;
const MAX_AGE_DAYS = 60;
const parser = new XMLParser({ ignoreAttributes: true, processEntities: true });

const text = (v: unknown): string => (typeof v === "string" ? v : v && typeof v === "object" && "#text" in v ? String((v as Record<string, unknown>)["#text"]) : "");

function clean(html: string, max = 200): string {
  const s = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&hellip;|&#8230;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*(The post .*)$/i, "")
    .replace(/\s*\[…\]\s*$|\s*\[&#8230;\]\s*$/g, "…")
    .trim();
  return s.length > max ? s.slice(0, max).replace(/\s+\S*$/, "") + "…" : s;
}

function topicFor(title: string, summary: string): string {
  const t = `${title} ${summary}`.toLowerCase();
  if (/(planning|application|development|demolition|housing scheme|redevelop)/.test(t)) return "Planning";
  if (/(tfl|bus|train|station|cycle|cycling|road|rail|transport|traffic|bridge|parking)/.test(t)) return "Transport";
  if (/(pub|restaurant|bar |cafe|café|beer|brewery|food|chef|menu|bakery|drink)/.test(t)) return "Food and drink";
  if (/(council|councillor|cabinet|budget|council tax|leader|mayor)/.test(t)) return "Council";
  return "Community";
}

async function readFeed(feed: { name: string; url: string; local?: boolean }): Promise<NewsArticle[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "SW18Hub/1.0 (+local news aggregator; links back to source)" },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["rss"] },
    });
    if (!res.ok) return [];
    const xml = parser.parse(await res.text());
    const raw = xml?.rss?.channel?.item;
    const items: Record<string, unknown>[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const cutoff = Date.now() - MAX_AGE_DAYS * 86400000;
    const out: NewsArticle[] = [];
    for (const it of items) {
      const title = clean(text(it.title), 200);
      const link = text(it.link);
      const date = new Date(text(it.pubDate));
      if (!title || !link || Number.isNaN(date.getTime()) || date.getTime() < cutoff) continue;
      const fullText = `${text(it.title)} ${text(it.description)}`;
      const summary = clean(text(it.description));
      out.push({
        id: `rss-${link}`,
        title,
        slug: link,
        summary,
        topic: topicFor(title, summary),
        sourceName: feed.name,
        sourceUrl: link,
        publishedAt: date.toISOString(),
        featured: false,
        sw18: Boolean(feed.local) || mentionsSW18(fullText),
      });
    }
    return out;
  } catch {
    return [];
  }
}

export async function getRssNews(): Promise<NewsArticle[]> {
  const all = (await Promise.all(NEWS_FEEDS.map(readFeed))).flat();
  const seen = new Set<string>();
  return all.filter((a) => {
    const key = a.sourceUrl ?? a.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
