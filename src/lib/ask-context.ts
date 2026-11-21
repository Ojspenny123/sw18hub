import { getDeals, getEvents, getNews, getVenues } from "./contentful";
import { withRatings } from "./google";
import { dayKey, eventType } from "./event-types";
import { bestSlug } from "./seo";

/**
 * The only knowledge the chatbot has: what is on the site. Written as compact text lines (far fewer tokens
 * than JSON) and kept in a stable order, so Anthropic's prompt cache can reuse it between questions.
 */
const TTL_MS = 10 * 60 * 1000;
let cached: { at: number; text: string } | null = null;

const trim = (s: string | undefined, n: number) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") + "…" : t;
};

export async function getAskContext(): Promise<string> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.text;

  const [venues, news, events, deals] = await Promise.all([getVenues(), getNews(), getEvents(), getDeals()]);
  const rated = (await withRatings(venues.slice(0, 250))).sort((a, b) => a.name.localeCompare(b.name));

  const places = rated.map((v) => {
    const g = v.google;
    const bits = [
      `${v.name} | ${v.type} | ${v.area}`,
      g?.rating ? `Google ${g.rating}/5 (${g.count} reviews)` : "no rating yet",
      v.features.length ? v.features.join(", ") : "",
      trim(v.description, 120),
      `page: /places/${v.slug}`,
    ];
    return bits.filter(Boolean).join(" | ");
  });

  const fmtDay = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" });
  const fmtTime = (iso: string) => (iso.includes("T") ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }) : "");

  const eventLines = events.slice(0, 40).map((e) =>
    [
      trim(e.title, 100),
      `${fmtDay(e.startsAt)} ${fmtTime(e.startsAt)}`.trim(),
      e.endsAt && dayKey(e.endsAt) > dayKey(e.startsAt) ? `runs until ${fmtDay(e.endsAt)}` : "",
      e.venueName ?? "",
      e.price ?? "",
      eventType(e),
      trim(e.description, 150),
      e.source ? `via ${e.source}` : "",
    ]
      .filter(Boolean)
      .join(" | "),
  );

  // SW18 stories first, then other Wandsworth borough stories, labelled so the chatbot can tell them apart.
  const newsOf = (list: typeof news, label: string) =>
    list.map((n) => `${n.publishedAt.slice(0, 10)} | ${label} | ${trim(n.title, 130)} | ${trim(n.summary, 200)} | ${n.sourceName ?? ""} | ${n.topic}`);
  const newsLines = [...newsOf(news.filter((n) => n.sw18).slice(0, 15), "SW18"), ...newsOf(news.filter((n) => !n.sw18).slice(0, 8), "wider Wandsworth")];

  const dealLines = deals.slice(0, 15).map((d) => `${d.businessName} | ${d.headline} | ${d.discountText} | code ${d.code}${d.validTo ? ` | until ${d.validTo.slice(0, 10)}` : ""}`);

  const text = [
    `TODAY: ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" })}`,
    `RANKING PAGES: /best/${bestSlug("Restaurant")}, /best/${bestSlug("Cafe")}, /best/${bestSlug("Bar")}, /best/${bestSlug("Pub")}, /best/${bestSlug("Takeaway")}`,
    "OTHER PAGES: /places (map and filters), /whats-on (events), /news, /deals, /about",
    `PLACES (${places.length}) name | type | area | Google rating | features | note | page:\n${places.join("\n")}`,
    `EVENTS (${eventLines.length}, soonest first) title | day time | venue | price | type | note | source:\n${eventLines.join("\n") || "none listed"}`,
    `LOCAL NEWS (${newsLines.length}, newest first) date | area | headline | summary | publisher | topic:\n${newsLines.join("\n") || "none"}`,
    `DEALS (${dealLines.length}) business | offer | detail | code:\n${dealLines.join("\n") || "none yet"}`,
  ].join("\n\n");

  cached = { at: Date.now(), text };
  return text;
}
