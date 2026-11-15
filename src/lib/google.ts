import { byScore } from "./rank";
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
        "X-Goog-FieldMask": "rating,userRatingCount,currentOpeningHours.openNow,googleMapsUri,location,businessStatus,photos.name,photos.authorAttributions.displayName",
      },
      // Cached for a year and only refreshed by the weekly Sunday job (see
      // netlify/functions/weekly-refresh.mjs -> /api/revalidate-google).
      next: { revalidate: 31536000, tags: [GOOGLE_CACHE_TAG] },
    });
    if (!res.ok) return undefined;
    const d = await res.json();
    if (d.businessStatus && d.businessStatus !== "OPERATIONAL") return undefined;
    const photo = d.photos?.[0];
    const photoUrl = photo?.name ? await fetchPhoto(photo.name) : undefined;
    return {
      photoUrl,
      photoCredit: photoUrl ? photo?.authorAttributions?.[0]?.displayName : undefined,
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

/** Resolves a Google photo reference to an image URL. Cached with the rest of the weekly Google data. */
async function fetchPhoto(name: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://places.googleapis.com/v1/${name}/media?maxHeightPx=600&skipHttpRedirect=true`, {
      headers: { "X-Goog-Api-Key": KEY as string },
      next: { revalidate: 31536000, tags: [GOOGLE_CACHE_TAG] },
    });
    if (!res.ok) return undefined;
    return (await res.json()).photoUri;
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
  return byScore(a, b);
}
