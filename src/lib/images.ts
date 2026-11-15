import type { VenueWithRating } from "./types";

/** Own photo from Contentful if there is one, otherwise the Google photo. */
export function venueImage(v: VenueWithRating, width: number): string | undefined {
  if (v.image) return `${v.image}?w=${width}&fm=webp`;
  return v.google?.photoUrl;
}
