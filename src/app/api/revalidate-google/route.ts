import { revalidateTag } from "next/cache";
import { getVenues } from "@/lib/contentful";
import { refreshGoogle, GOOGLE_CACHE_TAG } from "@/lib/google";
import { EVENTS_CACHE_TAG } from "@/lib/events";

export const maxDuration = 60;

/**
 * Called once a week (Sunday) by the Netlify scheduled function, or by hand
 * (add ?force=1 to refresh Google data even if the last snapshot is under 6 days old).
 * This is the only route that calls Google.
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorised", { status: 401 });
  }
  const force = new URL(req.url).searchParams.get("force") === "1";
  const venues = await getVenues();
  const google = await refreshGoogle(
    venues.map((v) => v.googlePlaceId).filter((x): x is string => Boolean(x)),
    force,
  );
  revalidateTag(GOOGLE_CACHE_TAG, "max");
  revalidateTag(EVENTS_CACHE_TAG, "max");
  return Response.json({ ok: true, refreshedAt: new Date().toISOString(), google });
}
