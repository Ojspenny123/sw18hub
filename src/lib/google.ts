import { byScore } from "./rank";
import type { Venue, VenueWithRating } from "./types";

/**
 * Google calls are switched off to avoid API charges: no Places or Maps requests
 * are made anywhere in the app. Venues are returned as they are held in Contentful.
 * (Kept as a tiny module so the rest of the code needs no changes.)
 */
export const GOOGLE_CACHE_TAG = "google";

export async function withRatings(venues: Venue[]): Promise<VenueWithRating[]> {
  return venues.map((v) => ({ ...v }));
}

export function byRating(a: VenueWithRating, b: VenueWithRating) {
  return byScore(a, b) || a.name.localeCompare(b.name);
}
