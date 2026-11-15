export const dynamic = "force-dynamic";

/** Setup check: shows which settings are present (never the values) and whether Contentful answers. */
export async function GET() {
  const space = process.env.CONTENTFUL_SPACE_ID;
  const token = process.env.CONTENTFUL_DELIVERY_TOKEN;
  const env = process.env.CONTENTFUL_ENVIRONMENT || "master";

  let contentful: string = "not configured";
  let venues: number | undefined;
  if (space && token) {
    try {
      const res = await fetch(
        `https://cdn.contentful.com/spaces/${space}/environments/${env}/entries?content_type=venue&limit=1`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      );
      contentful = res.ok ? "ok" : `error ${res.status}`;
      if (res.ok) venues = (await res.json()).total;
    } catch {
      contentful = "network error";
    }
  }

  return Response.json({
    CONTENTFUL_SPACE_ID: Boolean(space),
    CONTENTFUL_DELIVERY_TOKEN: Boolean(token),
    contentful,
    venuesInContentful: venues,
    GOOGLE_MAPS_API_KEY: Boolean(process.env.GOOGLE_MAPS_API_KEY),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
    NEXT_PUBLIC_GOOGLE_MAP_ID: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAP_ID),
    REVALIDATE_SECRET: Boolean(process.env.REVALIDATE_SECRET),
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
