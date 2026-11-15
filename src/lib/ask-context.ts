import { getDeals, getEvents, getNews, getVenues } from "./contentful";
import { withRatings } from "./google";
import { dayKey } from "./event-types";
import { bestSlug } from "./seo";

/**
 * The only knowledge the chatbot has: what is on the site. Written as compact text lines (far fewer tokens
 * than JSON) and kept in a stable order, so Anthropic's prompt cache can reuse it between questions.
 */
const TTL_MS = 30 * 60 * 1000;
let cached: { at: number; text: string } | null = null;

const trim = (s: string | undefined, n: number) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") + "…" : t;
};

export async function getAskContext(): Promise<string> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.text;

  const [venues, news, events, deals] = await Promise.all([getVenues(), getNews(), getEvents(), getDeals()]);
  const rated = (await withRatings(venues.slice(0, 120))).sort((a, b) => a.name.localeCompare(b.name));

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

  const eventLines = events.slice(0, 25).map((e) =>
    [
      trim(e.title, 90),
      `${dayKey(e.startsAt)}${e.startsAt.includes("T") ? " " + new Date(e.startsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }) : ""}`,
      e.endsAt && dayKey(e.endsAt) > dayKey(e.startsAt) ? `until ${dayKey(e.endsAt)}` : "",
      e.venueName ?? "",
      e.price ?? "",
    ]
      .filter(Boolean)
      .join(" | "),
  );

  const newsLines = news.filter((n) => n.sw18).slice(0, 12).map((n) => `${n.publishedAt.slice(0, 10)} | ${trim(n.title, 120)} | ${trim(n.summary, 140)} | ${n.sourceName ?? ""}`);

  const dealLines = deals.slice(0, 15).map((d) => `${d.businessName} | ${d.headline} | ${d.discountText} | code ${d.code}${d.validTo ? ` | until ${d.validTo.slice(0, 10)}` : ""}`);

  const text = [
    `TODAY: ${dayKey(new Date().toISOString())}`,
    `RANKING PAGES: /best/${bestSlug("Restaurant")}, /best/${bestSlug("Cafe")}, /best/${bestSlug("Bar")}, /best/${bestSlug("Pub")}, /best/${bestSlug("Takeaway")}`,
    "OTHER PAGES: /places (map and filters), /whats-on (events), /news, /deals, /about",
    `PLACES (${places.length}) name | type | area | Google rating | features | note | page:\n${places.join("\n")}`,
    `EVENTS (${eventLines.length}) title | date time | venue | price:\n${eventLines.join("\n") || "none listed"}`,
    `LOCAL NEWS (${newsLines.length}) date | headline | summary | source:\n${newsLines.join("\n") || "none"}`,
    `DEALS (${dealLines.length}) business | offer | detail | code:\n${dealLines.join("\n") || "none yet"}`,
  ].join("\n\n");

  cached = { at: Date.now(), text };
  return text;
}
