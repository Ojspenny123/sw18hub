// One-off, free: finds candidate photos for the KERB New Acres popup on KERB's own pages and New Acres' site.
import { writeFileSync } from "node:fs";
const pages = [
  "https://www.kerbfood.com/markets/new-acres/",
  "https://www.kerbfood.com/markets/",
  "https://www.kerbfood.com/kerb-life/",
  "https://www.kerbfood.com/category/events/",
  "https://www.newacreswandsworth.com/",
];
const out = {};
for (const url of pages) {
  try {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; SW18Hub/1.0)" }, redirect: "follow" });
    const html = await res.text();
    const meta = (p) => (html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${p}["'][^>]+content=["']([^"']+)`, "i")) || [])[1];
    const imgs = [...new Set([...html.matchAll(/https?:\/\/[^\s"'()<>]+\.(?:jpe?g|png|webp)/gi)].map((m) => m[0]))].filter((u) => !/favicon|logo|icon|birthday/i.test(u)).slice(0, 25);
    const posts = [...new Set([...html.matchAll(/https:\/\/www\.kerbfood\.com\/[a-z0-9-]*new-acres[a-z0-9-]*\/?/gi)].map((m) => m[0]))];
    out[url] = { status: res.status, og: meta("og:image"), twitter: meta("twitter:image"), title: (html.match(/<title>([^<]*)/i) || [])[1], posts, imgs };
  } catch (e) {
    out[url] = { error: String(e) };
  }
}
writeFileSync("data/probe-kerb.json", JSON.stringify(out, null, 2));
