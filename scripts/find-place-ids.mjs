#!/usr/bin/env node
/**
 * Looks up the Google Place ID for each SW18 Hub venue and prints the results.
 * Needs ONLY a Google key (the server key). Nothing is saved anywhere; paste the output back to Claude.
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=... node scripts/find-place-ids.mjs
 */
const KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!KEY) {
  console.error("Missing GOOGLE_MAPS_API_KEY");
  process.exit(1);
}

const VENUES = [
  {"name": "Le Gothique", "address": "Royal Victoria Patriotic Building, London SW18 3SX"},
  {"name": "The County Arms", "address": "Trinity Road, London SW18 3SH"},
  {"name": "The Roundhouse", "address": "2 North Side, Wandsworth Common, London SW18 2SS"},
  {"name": "Thai Girder", "address": "36 Replingham Road, London SW18 5LR"},
  {"name": "The Olive Garden", "address": "42 Replingham Road, London SW18 5LR"},
  {"name": "Bosa Kitchen", "address": "38 Replingham Road, London SW18 5LR"},
  {"name": "Pig and Whistle", "address": "479-481 Merton Road, London SW18 5LD"},
  {"name": "The Old Fields", "address": "20 Replingham Road, London SW18 5LS"},
  {"name": "The Gardeners", "address": "266-268 Merton Road, London SW18 5JL"},
  {"name": "The Earl Spencer", "address": "260-262 Merton Road, London SW18 5JL"},
  {"name": "Park Tavern", "address": "212 Merton Road, London SW18 5SW"},
  {"name": "The Jolly Gardeners", "address": "214 Garratt Lane, London SW18 4EA"},
  {"name": "The Wandle", "address": "332 Garratt Lane, London SW18 4EJ"},
  {"name": "The Country House", "address": "2-4 Groton Road, London SW18 4EP"},
  {"name": "The Earlsfield", "address": "511 Garratt Lane, London SW18 4SW"},
  {"name": "Halfway House", "address": "521-523 Garratt Lane, London SW18 4SR"},
  {"name": "The Old Sergeant", "address": "104 Garratt Lane, London SW18 4DJ"},
  {"name": "Megan's in the Tonsleys", "address": "539-541 Old York Road, London SW18"},
  {"name": "The Grapes", "address": "39 Fairfield Street, London SW18 1DX"},
  {"name": "Queen Adelaide", "address": "35 Putney Bridge Road, London SW18 1NP"},
  {"name": "The East Hill", "address": "21 Alma Road, London SW18 1AA"},
  {"name": "The King's Arms", "address": "94-96 Wandsworth High Street, London SW18 4LB"},
  {"name": "Spread Eagle", "address": "69-71 Wandsworth High Street, London SW18 2PT"},
  {"name": "The Cat's Back", "address": "52-54 Point Pleasant, London SW18 1NN"},
  {"name": "The Ship", "address": "41 Jews Row, London SW18 1TB"},
  {"name": "The Alma", "address": "499 Old York Road, London SW18 1TF"}
];

const norm = (s) => s.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, " ").trim();

async function search(name, address) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.businessStatus",
    },
    body: JSON.stringify({
      textQuery: `${name}, ${address}`,
      locationBias: { circle: { center: { latitude: 51.455, longitude: -0.19 }, radius: 4000 } },
      maxResultCount: 1,
    }),
  });
  if (!res.ok) throw new Error(`Places search ${res.status}: ${await res.text()}`);
  return (await res.json()).places?.[0];
}

const out = [];
for (const v of VENUES) {
  try {
    const p = await search(v.name, v.address);
    if (!p) {
      out.push({ name: v.name, result: "NONE" });
      continue;
    }
    const g = p.displayName?.text ?? "";
    const looksRight = norm(g).includes(norm(v.name)) || norm(v.name).includes(norm(g));
    const open = !p.businessStatus || p.businessStatus === "OPERATIONAL";
    out.push({
      name: v.name,
      result: looksRight && open ? "OK" : "CHECK",
      placeId: p.id,
      googleName: g,
      googleAddress: p.formattedAddress,
      status: p.businessStatus,
    });
  } catch (e) {
    out.push({ name: v.name, result: "ERROR", error: String(e.message).slice(0, 200) });
  }
}
console.log(JSON.stringify(out));
