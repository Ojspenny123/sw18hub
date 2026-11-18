import { getVenues } from "@/lib/contentful";
import { abs, bestCombos, bestSlug, bestTitle, SITE_DESCRIPTION } from "@/lib/seo";

export const revalidate = 3600;

/** A plain-text map of the site for AI assistants (see llmstxt.org). */
export async function GET() {
  const venues = await getVenues();
  const combos = bestCombos(venues);
  const lines = [
    "# SW18 Hub",
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "SW18 Hub is an independent local guide to south-west London postcode SW18. Events and news refresh every Sunday. News headlines link to the original publishers.",
    "",
    "## Rankings",
    ...combos.map((c) => `- [${bestTitle(c.type, c.area)}](${abs(`/best/${bestSlug(c.type, c.area)}`)}): ${c.count} places listed`),
    "",
    "## Main pages",
    `- [All places on a map](${abs("/places")}): filter by type, area and features`,
    `- [Local news and what's on](${abs("/news")}): headlines from local sources, with links to the originals`,
    `- [What's on in SW18](${abs("/whats-on")}): upcoming local events, each linking to the organiser`,
    `- [Local deals](${abs("/deals")}): discount codes from SW18 businesses`,
    `- [About and methodology](${abs("/about")}): how places are chosen`,
    "",
    "## Places",
    ...venues.map((v) => `- [${v.name}](${abs(`/places/${v.slug}`)}): ${v.type} in ${v.area}`),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
