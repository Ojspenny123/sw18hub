import data from "../../data/venue-osm.json";

/**
 * Free venue data from OpenStreetMap, looked up once (scripts/osm-lookup.mjs) and saved in the repo.
 * Nothing is fetched at runtime, so there are no API calls and no charges.
 */
export interface OsmInfo {
  lat: number;
  lon: number;
  openingHours?: string;
  phone?: string;
  website?: string;
  osm?: string;
}

const venues = (data as { venues: Record<string, OsmInfo> }).venues;

export const osmFor = (slug: string): OsmInfo | undefined => venues[slug];
