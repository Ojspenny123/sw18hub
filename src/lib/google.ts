import type { Rating, Venue, VenueWithRating } from "./types";

const KEY = process.env.GOOGLE_MAPS_API_KEY;
export const GOOGLE_CACHE_TAG = "google";

/** Live details from the Google Places API (New). Only the place ID is stored in Contentful (Google's terms restrict storing ratings and coordinates). */
async function fetchRating(placeId: string): Promise<Rating | undefined> {
  if (!KEY) return undefined;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask": "rating,userRatingCount,currentOpeningHours.openNow,googleMapsUri,location,businessStatus",
      },
      // Cached for a year and only refreshed by the weekly Sunday job (see
      // netlify/functions/weekly-refresh.mjs -> /api/revalidate-google).
      next: { revalidate: 31536000, tags: [GOOGLE_CACHE_TAG] },
    });
    if (!res.ok) return undefined;
    const d = await res.json();
    if (d.businessStatus && d.businessStatus !== "OPERATIONAL") return undefined;
    return {
      rating: d.rating,
      count: d.userRatingCount,
      openNow: d.currentOpeningHours?.openNow,
      mapsUri: d.googleMapsUri,
      lat: d.location?.latitude,
      lon: d.location?.longitude,
    };
  } catch {
    return undefined;
  }
}

export async function withRatings(venues: Venue[]): Promise<VenueWithRating[]> {
  return Promise.all(
    venues.map(async (v) => ({
      ...v,
      google: v.googlePlaceId ? await fetchRating(v.googlePlaceId) : undefined,
    })),
  );
}

export function byRating(a: VenueWithRating, b: VenueWithRating) {
  return (b.google?.rating ?? 0) - (a.google?.rating ?? 0) || (b.google?.count ?? 0) - (a.google?.count ?? 0);
}
