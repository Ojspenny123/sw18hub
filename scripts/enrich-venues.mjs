#!/usr/bin/env node
/**
 * Finds the Google Place ID for each venue in Contentful and saves it on the entry.
 *
 * Only the Place ID is stored (Google allows that). Ratings, open now and map position
 * are fetched live by the site.
 *
 * Usage (run on your own computer, never commit keys):
 *   GOOGLE_MAPS_API_KEY=... CONTENTFUL_SPACE_ID=rfvqnggtcs8w CONTENTFUL_MANAGEMENT_TOKEN=... \
 *     node scripts/enrich-venues.mjs            # dry run: shows what it would do
 *     node scripts/enrich-venues.mjs --write    # saves and publishes the Place IDs
 */
const { GOOGLE_MAPS_API_KEY, CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_TOKEN } = process.env;
const ENV = process.env.CONTENTFUL_ENVIRONMENT || "master";
const WRITE = process.argv.includes("--write");

for (const [k, v] of Object.entries({ GOOGLE_MAPS_API_KEY, CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_TOKEN })) {
  if (!v) {
    console.error(`Missing ${k}`);
    process.exit(1);
  }
}

const CMA = `https://api.contentful.com/spaces/${CONTENTFUL_SPACE_ID}/environments/${ENV}`;
const cmaHeaders = { Authorization: `Bearer ${CONTENTFUL_MANAGEMENT_TOKEN}`, "Content-Type": "application/vnd.contentful.management.v1+json" };
const LOCALE = "en-US";

const norm = (s) => s.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, " ").trim();

async function searchPlace(name, address) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.businessStatus",
    },
    body: JSON.stringify({
      textQuery: `${name}, ${address}`,
      locationBias: { circle: { center: { latitude: 51.455, longitude: -0.19 }, radius: 4000 } },
      maxResultCount: 1,
    }),
  });
  if (!res.ok) throw new Error(`Places search ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.places?.[0];
}

async function main() {
  const res = await fetch(`${CMA}/entries?content_type=venue&limit=200`, { headers: cmaHeaders });
  if (!res.ok) throw new Error(`Contentful ${res.status}: ${await res.text()}`);
  const { items } = await res.json();
  console.log(`${items.length} venues found. ${WRITE ? "WRITING changes." : "Dry run (add --write to save)."}\n`);

  for (const entry of items) {
    const f = entry.fields;
    const name = f.name?.[LOCALE];
    if (f.googlePlaceId?.[LOCALE]) {
      console.log(`skip   ${name} (already has a Place ID)`);
      continue;
    }
    const place = await searchPlace(name, f.address?.[LOCALE] ?? "Wandsworth London");
    if (!place) {
      console.log(`NONE   ${name}: no match on Google`);
      continue;
    }
    const gName = place.displayName?.text ?? "";
    const looksRight = norm(gName).includes(norm(name)) || norm(name).includes(norm(gName));
    const status = place.businessStatus;
    const flag = status && status !== "OPERATIONAL" ? ` [${status}]` : "";
    console.log(`${looksRight && !flag ? "match " : "CHECK "} ${name} -> ${gName} | ${place.formattedAddress}${flag}`);
    if (!looksRight || flag) continue; // never save a doubtful match or a closed venue

    if (!WRITE) continue;
    const wasPublished = Boolean(entry.sys.publishedVersion);
    const updated = { fields: { ...f, googlePlaceId: { [LOCALE]: place.id } } };
    const put = await fetch(`${CMA}/entries/${entry.sys.id}`, {
      method: "PUT",
      headers: { ...cmaHeaders, "X-Contentful-Version": String(entry.sys.version) },
      body: JSON.stringify(updated),
    });
    if (!put.ok) {
      console.log(`  FAILED to save ${name}: ${put.status} ${await put.text()}`);
      continue;
    }
    const saved = await put.json();
    if (wasPublished) {
      const pub = await fetch(`${CMA}/entries/${entry.sys.id}/published`, {
        method: "PUT",
        headers: { ...cmaHeaders, "X-Contentful-Version": String(saved.sys.version) },
      });
      console.log(pub.ok ? "  saved and published" : `  saved, but publish failed: ${pub.status}`);
    } else {
      console.log("  saved (draft)");
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
