/**
 * One-off, FREE lookup of openly licensed venue photos from Wikimedia Commons.
 * Uses each venue's coordinates (data/venue-osm.json) to find nearby Commons files, and only
 * keeps a photo if its title matches the venue name and its licence is CC BY / CC BY-SA / CC0 / public domain.
 * Writes data/venue-images.json (committed; the site reads it, nothing is fetched at runtime).
 *   node scripts/commons-images.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { nameScore } from "./osm-lookup.mjs";

const UA = "SW18Hub/1.0 (community guide; one-off openly-licensed photo lookup)";
const OK_LICENCE = /^(cc[ -]by(?![ -]?(nc|nd))|cc0|public domain|pd)/i;
const stripHtml = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const cleanTitle = (t) => t.replace(/^File:/, "").replace(/\.[a-z]+$/i, "").replace(/[_-]+/g, " ");

export function acceptable(venueName, f) {
  const info = f.imageinfo?.[0];
  if (!info || !/^image\/(jpeg|png)$/.test(info.mime || "")) return false;
  const lic = info.extmetadata?.LicenseShortName?.value || "";
  if (!OK_LICENCE.test(lic.trim())) return false;
  // the file title must mention the venue, so we never show a random street photo
  return nameScore(venueName, cleanTitle(f.title)) >= 0.5 || cleanTitle(f.title).toLowerCase().includes(venueName.toLowerCase().replace(/^the /, ""));
}

async function near(lat, lon) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=geosearch&ggsnamespace=6&ggslimit=30&ggsradius=120" +
    `&ggscoord=${lat}%7C${lon}&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata&iiurlwidth=900`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  return Object.values((await res.json()).query?.pages || {});
}

async function byName(name) {
  const q = encodeURIComponent(`${name} Wandsworth OR Earlsfield OR Southfields OR London`);
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=15" +
    `&gsrsearch=${q}&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata&iiurlwidth=900`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  return Object.values((await res.json()).query?.pages || {});
}

// Pub names that are also place names: a title match would pick up buses and rivers, so these stay without a photo.
const SKIP = new Set(["the-earlsfield", "the-wandle-earlsfield"]);

async function main() {
  const seed = JSON.parse(readFileSync(new URL("../data/venues-seed.json", import.meta.url)));
  const osm = JSON.parse(readFileSync(new URL("../data/venue-osm.json", import.meta.url))).venues;
  const out = {}, none = [];
  for (const v of seed) {
    if (SKIP.has(v.slug)) { none.push(v.slug); continue; }
    const p = osm[v.slug];
    await new Promise((r) => setTimeout(r, 400));
    let files = [];
    try { if (p && !p.approx) files = await near(p.lat, p.lon); } catch (e) { console.error(v.slug, e.message); }
    let hit = files.find((f) => acceptable(v.name, f));
    if (!hit) {
      await new Promise((r) => setTimeout(r, 400));
      try { hit = (await byName(v.name)).find((f) => acceptable(v.name, f)); } catch (e) { console.error(v.slug, e.message); }
    }
    if (!hit) { none.push(v.slug); continue; }
    const i = hit.imageinfo[0], m = i.extmetadata || {};
    out[v.slug] = {
      url: i.thumburl || i.url,
      page: i.descriptionurl,
      title: cleanTitle(hit.title),
      author: stripHtml(m.Artist?.value) || "Unknown",
      license: stripHtml(m.LicenseShortName?.value),
      licenseUrl: m.LicenseUrl?.value,
    };
  }
  writeFileSync(new URL("../data/venue-images.json", import.meta.url), JSON.stringify({ fetchedAt: new Date().toISOString(), source: "Wikimedia Commons (openly licensed)", images: out, none }, null, 1));
  console.log(`photos for ${Object.keys(out).length}/${seed.length}; none: ${none.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
