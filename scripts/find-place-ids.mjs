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
  {"id": "7jL9pkNhtoWuvuf3Jpu5Sg", "name": "Le Gothique", "address": "Royal Victoria Patriotic Building, London SW18 3SX"},
  {"id": "6cYJTg7p4Pixuazk5grVcY", "name": "The County Arms", "address": "Trinity Road, London SW18 3SH"},
  {"id": "1jexne5BWvTfhwOc3ChUu5", "name": "The Roundhouse", "address": "2 North Side, Wandsworth Common, London SW18 2SS"},
  {"id": "6axZ3XFCQrxyzdraOltnNZ", "name": "Thai Girder", "address": "36 Replingham Road, London SW18 5LR"},
  {"id": "6ZOw9gO8kYO1fFHk23y29A", "name": "The Olive Garden", "address": "42 Replingham Road, London SW18 5LR"},
  {"id": "6NyS5Gc8CqESsj0gOPbGrp", "name": "Bosa Kitchen", "address": "38 Replingham Road, London SW18 5LR"},
  {"id": "4iGJFA8hip3w8PbGDxIW8w", "name": "Pig and Whistle", "address": "479-481 Merton Road, London SW18 5LD"},
  {"id": "3op4LhJxVUqvBaJX1zdfN1", "name": "The Old Fields", "address": "20 Replingham Road, London SW18 5LS"},
  {"id": "Ai8tVvi3dS9votPgXcZnQ", "name": "The Gardeners", "address": "266-268 Merton Road, London SW18 5JL"},
  {"id": "4Gre5cPt99IhEkDQJXzAMt", "name": "The Earl Spencer", "address": "260-262 Merton Road, London SW18 5JL"},
  {"id": "3f9V3QGKWP5jvbHzMRaVO7", "name": "Park Tavern", "address": "212 Merton Road, London SW18 5SW"},
  {"id": "15ny6RSdaTK7AqCAA2BYcU", "name": "The Jolly Gardeners", "address": "214 Garratt Lane, London SW18 4EA"},
  {"id": "6Yj1RC0SRE1zxWoSucRxRf", "name": "The Wandle", "address": "332 Garratt Lane, London SW18 4EJ"},
  {"id": "1nMXyt8ka3oao1o5nmE0El", "name": "The Country House", "address": "2-4 Groton Road, London SW18 4EP"},
  {"id": "Z7dQcRgFCuwbF1gxK0JrY", "name": "The Earlsfield", "address": "511 Garratt Lane, London SW18 4SW"},
  {"id": "43mqcIGI59n3HPL39oF3Zr", "name": "Halfway House", "address": "521-523 Garratt Lane, London SW18 4SR"},
  {"id": "7mDQrDUrLwOQ8jD5OHxtfl", "name": "The Old Sergeant", "address": "104 Garratt Lane, London SW18 4DJ"},
  {"id": "666cjj9y23T4A8PwgUP2MZ", "name": "Megan's in the Tonsleys", "address": "539-541 Old York Road, London SW18"},
  {"id": "5JAqp76HUWjhLhy7GFOU6o", "name": "The Grapes", "address": "39 Fairfield Street, London SW18 1DX"},
  {"id": "49sf5qcaYljQMTQJBv27xu", "name": "Queen Adelaide", "address": "35 Putney Bridge Road, London SW18 1NP"},
  {"id": "5inL3LoREiAxyvYL3WXUEP", "name": "The East Hill", "address": "21 Alma Road, London SW18 1AA"},
  {"id": "57XsadUUVDQrZFHEvIJW1k", "name": "The King's Arms", "address": "94-96 Wandsworth High Street, London SW18 4LB"},
  {"id": "2auJgXwzhMjGKQP58JX2Bu", "name": "Spread Eagle", "address": "69-71 Wandsworth High Street, London SW18 2PT"},
  {"id": "6r8Hf9QNvGqrUR5pOyE55y", "name": "The Cat's Back", "address": "52-54 Point Pleasant, London SW18 1NN"},
  {"id": "4MwWlAiCX4lYXpvTg3T5ip", "name": "The Ship", "address": "41 Jews Row, London SW18 1TB"},
  {"id": "660eYERjElb0GRbPpR0EFp", "name": "The Alma", "address": "499 Old York Road, London SW18 1TF"}
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
      out.push({ id: v.id, name: v.name, result: "NONE" });
      continue;
    }
    const g = p.displayName?.text ?? "";
    const looksRight = norm(g).includes(norm(v.name)) || norm(v.name).includes(norm(g));
    const open = !p.businessStatus || p.businessStatus === "OPERATIONAL";
    out.push({
      id: v.id,
      name: v.name,
      result: looksRight && open ? "OK" : "CHECK",
      placeId: p.id,
      googleName: g,
      googleAddress: p.formattedAddress,
      status: p.businessStatus,
    });
  } catch (e) {
    out.push({ id: v.id, name: v.name, result: "ERROR", error: String(e.message).slice(0, 200) });
  }
}
console.log(JSON.stringify(out));
