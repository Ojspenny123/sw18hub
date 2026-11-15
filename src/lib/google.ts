import type { Rating, Venue, VenueWithRating } from "./types";

const KEY = process.env.GOOGLE_MAPS_API_KEY;

/** Live rating from the Google Places API (New). Only the place ID is stored in Contentful. */
async function fetchRating(placeId: string): Promise<Rating | undefined> {
  if (!KEY) return undefined;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask": "rating,userRatingCount,currentOpeningHours.openNow,googleMapsUri",
      },
      // Short cache so we do not hit Google on every request.
      next: { revalidate: 1800 },
    });
    if (!res.ok) return undefined;
    const d = await res.json();
    return {
      rating: d.rating,
      count: d.userRatingCount,
      openNow: d.currentOpeningHours?.openNow,
      mapsUri: d.googleMapsUri,
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
