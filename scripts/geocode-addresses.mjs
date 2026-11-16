/**
 * One-off, FREE: gives a map position to venues the OSM name search could not match, using their street address.
 * 1) Nominatim (OpenStreetMap) structured address search, 2) postcodes.io postcode centre as a fallback (marked approx).
 * Merges into data/venue-osm.json. Never overwrites a venue that already matched by name.
 *   node scripts/geocode-addresses.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const UA = "SW18Hub/1.0 (community guide; one-off address lookup)";
const file = new URL("../data/venue-osm.json", import.meta.url);
const inArea = (lat, lon) => lat > 51.41 && lat < 51.49 && lon > -0.26 && lon < -0.14;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const expand = (s) => s.replace(/\bRd\b/g, "Road").replace(/\bLn\b/g, "Lane").replace(/\bSt\b/g, "Street");

function parse(address) {
  const pc = (address.match(/SW18\s*\d[A-Z]{2}/i) || [""])[0].toUpperCase().replace(/^SW18\s*/, "SW18 ");
  const parts = address.replace(/,?\s*London\s*SW18.*$/i, "").split(",").map((s) => s.trim());
  // street = the part that starts with a house number and has a road name
  const street = expand(parts.find((p) => /^\d+[a-z]?(-\d+)?\s+\D/i.test(p)) || parts[0]);
  return { pc, street: street.replace(/^(\d+)-\d+/, "$1") };
}

async function nominatim(params) {
  await sleep(1100);
  const u = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=gb&" + new URLSearchParams(params);
  const res = await fetch(u, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const hit = (await res.json()).find((h) => inArea(+h.lat, +h.lon));
  return hit ? { lat: +hit.lat, lon: +hit.lon, osm: `${hit.osm_type}/${hit.osm_id}`, match: hit.display_name } : null;
}

async function postcode(pc) {
  const res = await fetch("https://api.postcodes.io/postcodes/" + encodeURIComponent(pc.replace(/\s/g, "")), { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const r = (await res.json()).result;
  return r && inArea(r.latitude, r.longitude) ? { lat: r.latitude, lon: r.longitude } : null;
}

const seed = JSON.parse(readFileSync(new URL("../data/venues-seed.json", import.meta.url)));
const data = JSON.parse(readFileSync(file));
const left = [];
for (const slug of [...data.unmatched]) {
  const v = seed.find((s) => s.slug === slug);
  if (!v || !v.address) { left.push(slug); continue; }
  const { pc, street } = parse(v.address);
  let r = null, via = "";
  try {
    r = await nominatim({ street, city: "London", postalcode: pc });
    if (r) via = "address";
    if (!r) { r = await nominatim({ q: `${street}, ${pc}` }); if (r) via = "address"; }
    if (!r && pc) { r = await postcode(pc); if (r) via = "postcode"; }
  } catch (e) { console.error(slug, e.message); }
  if (!r) { left.push(slug); console.log("MISS", slug, v.address); continue; }
  data.venues[slug] = { lat: r.lat, lon: r.lon, ...(r.osm ? { osm: r.osm } : {}), via, approx: via === "postcode" || undefined, note: via === "postcode" ? "Approximate: placed at the postcode centre" : "Placed from street address" };
  console.log(via.toUpperCase().padEnd(8), slug, r.lat.toFixed(5), r.lon.toFixed(5));
}
data.unmatched = left;
data.fetchedAt = new Date().toISOString();
writeFileSync(file, JSON.stringify(data, null, 1));
console.log(`placed ${Object.keys(data.venues).length}/${seed.length}; still without a pin: ${left.length}`);
