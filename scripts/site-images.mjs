/**
 * One-off, FREE: reads each venue's own website for its main picture (the og:image the site publishes for sharing)
 * and saves the address + credit to data/venue-site-images.json. The site hotlinks it and credits the venue.
 * Skips venues that already have an openly licensed Commons photo. Nothing is fetched at runtime.
 *   node scripts/site-images.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const UA = "Mozilla/5.0 (compatible; SW18Hub/1.0; community guide, one-off image lookup)";
const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const seed = read("../data/venues-seed.json");
const osm = read("../data/venue-osm.json").venues;
const commons = read("../data/venue-images.json").images;

const meta = (html, re) => (html.match(re) || [])[1];
function pickImage(html, base) {
  const raw =
    meta(html, /<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i) ||
    meta(html, /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image["']/i) ||
    meta(html, /<meta[^>]+(?:property|name)=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i) ||
    meta(html, /<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i);
  if (!raw) return null;
  try { return new URL(raw.replace(/&amp;/g, "&"), base).href; } catch { return null; }
}

const out = {}, none = [];
for (const v of seed) {
  const site = v.website || osm[v.slug]?.website;
  if (commons[v.slug] || !site) continue;
  try {
    const page = await fetch(site, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(12000) });
    if (!page.ok) { none.push([v.slug, "page " + page.status]); continue; }
    const img = pickImage(await page.text(), page.url);
    if (!img || !/^https:/.test(img) || /logo|favicon|icon|placeholder/i.test(img)) { none.push([v.slug, img ? "looks like a logo" : "no image tag"]); continue; }
    const head = await fetch(img, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(12000) });
    if (!head.ok || !/^image\/(jpeg|png|webp)/.test(head.headers.get("content-type") || "")) { none.push([v.slug, "image not usable"]); continue; }
    out[v.slug] = { url: img, page: page.url, site: new URL(page.url).hostname.replace(/^www\./, "") };
    console.log("OK  ", v.slug, img);
  } catch (e) { none.push([v.slug, e.message]); }
}
for (const [s, why] of none) console.log("MISS", s, why);
writeFileSync(new URL("../data/venue-site-images.json", import.meta.url), JSON.stringify({ fetchedAt: new Date().toISOString(), source: "Venue websites (credited to the venue)", images: out, none }, null, 1));
console.log(`site images for ${Object.keys(out).length}`);
