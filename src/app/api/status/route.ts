import { CONTENT_TYPES, SITE_TAG } from "@/lib/contentful";

export const dynamic = "force-dynamic";

/** Setup check: shows which settings are present (never the values) and whether Contentful answers. */
export async function GET() {
  const space = process.env.CONTENTFUL_SPACE_ID;
  const token = process.env.CONTENTFUL_DELIVERY_TOKEN;
  const env = process.env.CONTENTFUL_ENVIRONMENT || "master";

  let contentful: string = "not configured";
  const counts: Record<string, number | string> = {};
  if (space && token) {
    const count = async (type: string, tagged: boolean) => {
      const tag = tagged ? `&metadata.tags.sys.id[in]=${SITE_TAG}` : "";
      try {
        const res = await fetch(`https://cdn.contentful.com/spaces/${space}/environments/${env}/entries?content_type=${type}&limit=1${tag}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        return res.ok ? ((await res.json()).total as number) : `error ${res.status}`;
      } catch {
        return "network error";
      }
    };
    counts.venues = await count(CONTENT_TYPES.venue, false);
    counts.venuesTagged = await count(CONTENT_TYPES.venue, true);
    counts.events = await count(CONTENT_TYPES.event, false);
    counts.eventsTagged = await count(CONTENT_TYPES.event, true);
    contentful = typeof counts.venues === "number" ? "ok" : String(counts.venues);
  }

  return Response.json({
    CONTENTFUL_SPACE_ID: Boolean(space),
    CONTENTFUL_DELIVERY_TOKEN: Boolean(token),
    contentful,
    contentTypes: CONTENT_TYPES,
    counts,
    GOOGLE_MAPS_API_KEY: Boolean(process.env.GOOGLE_MAPS_API_KEY),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
    NEXT_PUBLIC_GOOGLE_MAP_ID: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAP_ID),
    REVALIDATE_SECRET: Boolean(process.env.REVALIDATE_SECRET),
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
