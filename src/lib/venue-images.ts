import commons from "../../data/venue-images.json";
import site from "../../data/venue-site-images.json";

/**
 * Venue photos, looked up once by scripts (nothing is fetched at runtime) and saved in the repo.
 * 1) Openly licensed photos from Wikimedia Commons (CC BY / CC BY-SA / CC0 / public domain), credited to the author.
 * 2) Otherwise the main picture from the venue's own website, credited to the venue.
 */
export interface VenuePhoto {
  url: string;
  page?: string;
  credit: string;
}

type CommonsEntry = { url: string; page?: string; author: string; license: string };
type SiteEntry = { url: string; page?: string; site: string };

const c = (commons as { images: Record<string, CommonsEntry> }).images;
const s = (site as { images: Record<string, SiteEntry> }).images;

export const photoFor = (slug: string, venueName: string): VenuePhoto | undefined => {
  if (c[slug]) return { url: c[slug].url, page: c[slug].page, credit: `Photo: ${c[slug].author}, ${c[slug].license}, via Wikimedia Commons` };
  if (s[slug]) return { url: s[slug].url, page: s[slug].page, credit: `Photo: ${venueName} (${s[slug].site})` };
  return undefined;
};
