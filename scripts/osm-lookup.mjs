/**
 * One-off, FREE lookup of coordinates, opening hours, phone and website for each venue,
 * from OpenStreetMap (Overpass API; Nominatim as a fallback for anything not matched).
 * No API key and no cost. Run by the GitHub Action "osm-venues" or locally:
 *   node scripts/osm-lookup.mjs
 * Reads data/venues-seed.json, writes data/venue-osm.json (committed; the site reads it, no live calls).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const UA = "SW18Hub/1.0 (community guide; one-off venue lookup)";
const BBOX = "51.425,-0.235,51.475,-0.165"; // south,west,north,east around SW18

export const norm = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’.]/g, "")
    .replace(/\b(the|wandsworth|earlsfield|southfields|london|ltd|c i c|cic)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function nameScore(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.85;
  const ta = new Set(x.split(" ")), tb = new Set(y.split(" "));
  const inter = [...ta].filter((t) => tb.has(t)).length;
  return inter / Math.max(ta.size, tb.size);
}

const streetOf = (addr) => norm((addr || "").replace(/^[\w\s,-]*?\d+[a-z]?(-\d+)?\s+/i, "").split(",")[0]);

export function bestMatch(venue, elements) {
  const vStreet = streetOf(venue.address);
  let best = null;
  for (const e of elements) {
    const t = e.tags || {};
    const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
    if (!t.name || lat == null || lon == null) continue;
    let score = nameScore(venue.name, t.name);
    const eStreet = norm(t["addr:street"]);
    if (eStreet && vStreet && (eStreet.includes(vStreet) || vStreet.includes(eStreet))) score += 0.25;
    if (!best || score > best.score) best = { score, e, lat, lon };
  }
  return best && best.score >= 0.6 ? best : null;
}

const pick = (t) => ({
  openingHours: t.opening_hours || undefined,
  phone: t.phone || t["contact:phone"] || undefined,
  website: t.website || t["contact:website"] || undefined,
});

async function overpass() {
  const q = `[out:json][timeout:90];(
    nwr["amenity"~"^(pub|bar|cafe|restaurant|fast_food|ice_cream|biergarten|food_court)$"]["name"](${BBOX});
    nwr["shop"~"^(bakery|deli|convenience|greengrocer|butcher|pastry|coffee|confectionery|seafood|wine|alcohol)$"]["name"](${BBOX});
  );out center tags;`;
  for (const url of ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]) {
    try {
      const res = await fetch(url, { method: "POST", headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(q) });
      if (res.ok) return (await res.json()).elements || [];
      console.error("Overpass", url, res.status);
    } catch (e) {
      console.error("Overpass", url, e.message);
    }
  }
  return [];
}

async function nominatim(v) {
  const pc = (v.address.match(/SW18\s*\d[A-Z]{2}/i) || [""])[0];
  for (const q of [`${v.name}, ${pc || v.area + ", London"}`, `${v.name}, ${v.address}`]) {
    await new Promise((r) => setTimeout(r, 1100)); // Nominatim: max 1 request a second
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&extratags=1&countrycodes=gb&viewbox=-0.235,51.475,-0.165,51.425&bounded=1&q=${encodeURIComponent(q)}`, { headers: { "User-Agent": UA } });
    if (!res.ok) continue;
    const list = await res.json();
    const els = list.map((r) => ({ lat: +r.lat, lon: +r.lon, type: r.osm_type, id: r.osm_id, tags: { ...(r.extratags || {}), name: r.name || r.display_name.split(",")[0] } }));
    const m = bestMatch(v, els);
    if (m) return m;
  }
  return null;
}

async function main() {
  const seed = JSON.parse(readFileSync(new URL("../data/venues-seed.json", import.meta.url)));
  const elements = await overpass();
  console.log("OSM elements:", elements.length);
  const out = {}, unmatched = [];
  for (const v of seed) {
    let m = bestMatch(v, elements), via = "overpass";
    if (!m) { m = await nominatim(v); via = "nominatim"; }
    if (!m) { unmatched.push(v.slug); continue; }
    const t = m.e.tags || {};
    out[v.slug] = {
      lat: +m.lat.toFixed(6),
      lon: +m.lon.toFixed(6),
      ...pick(t),
      osm: `https://www.openstreetmap.org/${m.e.type}/${m.e.id}`,
      matchedName: t.name,
      score: +m.score.toFixed(2),
      via,
    };
  }
  writeFileSync(new URL("../data/venue-osm.json", import.meta.url), JSON.stringify({ fetchedAt: new Date().toISOString(), source: "OpenStreetMap contributors (ODbL)", venues: out, unmatched }, null, 1));
  console.log(`matched ${Object.keys(out).length}/${seed.length}; unmatched: ${unmatched.join(", ") || "none"}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
