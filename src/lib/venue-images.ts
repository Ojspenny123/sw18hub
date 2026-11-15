import data from "../../data/venue-images.json";

/**
 * Openly licensed (CC BY / CC BY-SA / CC0 / public domain) venue photos from Wikimedia Commons,
 * looked up once by scripts/commons-images.mjs and saved in the repo. Nothing is fetched at runtime.
 * The licences require crediting the author, which the site does under each photo.
 */
export interface CommonsPhoto {
  url: string;
  page?: string;
  author: string;
  license: string;
}

const images = (data as { images: Record<string, CommonsPhoto> }).images;

export const photoFor = (slug: string): CommonsPhoto | undefined => images[slug];
