import type { Venue } from "./types";

/** Own photo from Contentful if there is one, otherwise an openly licensed Wikimedia Commons photo. */
export function venueImage(v: Venue, width: number): string | undefined {
  if (v.image) return `${v.image}?w=${width}&fm=webp`;
  return v.photo?.url;
}
