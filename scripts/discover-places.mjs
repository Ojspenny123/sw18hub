#!/usr/bin/env node
/**
 * Finds well-rated cafes, bars, takeaways (and restaurants / pubs) in SW18 using Google Places
 * and prints them as JSON. Nothing is saved anywhere: paste the output back to Claude, who adds
 * the places to Contentful (only the Place ID is stored; ratings are fetched live by the site).
 *
 * Needs ONLY a Google key (the server key). Usage:
 *   GOOGLE_MAPS_API_KEY=... node scripts/discover-places.mjs
 *   GOOGLE_MAPS_API_KEY=... node scripts/discover-places.mjs --types=Cafe,Bar --limit=20 --min-rating=4.2
 *
 * Options:
 *   --types=Cafe,Bar,Takeaway,Restaurant,Pub   which kinds to look for (default: all but Pub)
 *   --limit=15        best N per type (default 15)
 *   --min-rating=4.0  (default 4.0)
 *   --min-reviews=25  (default 25)
 */
const KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!KEY) {
  console.error("Missing GOOGLE_MAPS_API_KEY");
  process.exit(1);
}
const arg = (name, dflt) => {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : dflt;
};
const TYPES = arg("types", "Cafe,Bar,Takeaway,Restaurant").split(",").map((s) => s.trim());
const LIMIT = Number(arg("limit", 15));
const MIN_RATING = Number(arg("min-rating", 4.0));
const MIN_REVIEWS = Number(arg("min-reviews", 25));

// Place IDs already on the site, so we do not suggest them again.
const EXISTING = new Set([
  "ChIJXzcClZIFdkgR_54L8Hk2k-k", "ChIJT0kSE-0FdkgRImrBZMF8YFM", "ChIJmckTupEFdkgRFxsd9P0lgpw", "ChIJUZ-TBgcPdkgR7krEwSm8MzE",
  "ChIJZQa5PkQPdkgRQQk-lSKgb6w", "ChIJ-8xGO0QPdkgRxjRJ2imhTpY", "ChIJkZXSy1wPdkgRK8Ic7SZ0PHo", "ChIJ4_01m0YPdkgRQJ-Pctderbc",
  "ChIJt22QlEYPdkgR5gI_9sSsYNQ", "ChIJG1hXM0MPdkgRhdeefJOntlc", "ChIJcye5Sl0PdkgRt9aOHcDJh_E", "ChIJ9yRMMV8PdkgRuwy46pn3z30",
  "ChIJ8UXo6vMFdkgRFH4CaoylEPs", "ChIJS7hpI1gPdkgRUvyG6fFjjaU", "ChIJsXHaDVgPdkgRgg8HuJD_4gU", "ChIJjd_S_fcFdkgR0h__WkC8ULc",
  "ChIJOb3Kp18PdkgR9gXrnZwdXPU", "ChIJo9UfG8oPdkgRceHo8Gt_TrE", "ChIJvwcTS2IPdkgRvKxGVHKM3fk", "ChIJ2_Gatm8PdkgRsCO913H8Y3U",
  "ChIJY86uvIkFdkgR7PYSquZ3sIY", "ChIJiTTuHmQPdkgRqsW6CbXppng", "ChIJX2nKXWEPdkgRsGkJSXcYE3s", "ChIJZaXU4W8PdkgR4vOIopu84EE",
  "ChIJkxWeZ30PdkgRZiJi42dFC8o", "ChIJu9nRhmwFdkgRbOPkSd09iRE",
]);

const AREAS = [
  { name: "Wandsworth Town", lat: 51.4565, lon: -0.1915 },
  { name: "Earlsfield", lat: 51.4425, lon: -0.1885 },
  { name: "Southfields", lat: 51.4455, lon: -0.2065 },
  { name: "Wandsworth Common", lat: 51.4478, lon: -0.171 },
];
const BOX = { low: { latitude: 51.425, longitude: -0.225 }, high: { latitude: 51.47, longitude: -0.155 } };

const TERMS = {
  Cafe: ["cafe", "coffee shop", "bakery cafe"],
  Bar: ["bar", "cocktail bar", "wine bar"],
  Takeaway: ["takeaway", "fish and chips", "pizza takeaway", "indian takeaway"],
  Restaurant: ["restaurant"],
  Pub: ["pub"],
};
const TAKEAWAY_PRIMARY = new Set(["meal_takeaway", "meal_delivery", "fast_food_restaurant", "fish_and_chips_restaurant", "kebab_shop", "pizza_delivery", "sandwich_shop"]);
const CAFE_PRIMARY = new Set(["cafe", "coffee_shop", "bakery", "tea_house", "brunch_restaurant", "breakfast_restaurant"]);
const BAR_PRIMARY = new Set(["bar", "cocktail_bar", "wine_bar", "lounge_bar", "sports_bar"]);
const CHAINS = /\b(starbucks|costa coffee|pret a manger|mcdonald|kfc|subway|greggs|domino|burger king|nando|pizza hut|papa john|wetherspoon|leon|itsu|wasabi|gail'?s|caffe nero|tesco|sainsbury|waitrose|m&s|co-op)\b/i;

function classify(p) {
  const primary = p.primaryType ?? "";
  const types = p.types ?? [];
  if (primary === "pub" || types.includes("pub")) return "Pub";
  if (BAR_PRIMARY.has(primary)) return "Bar";
  if (CAFE_PRIMARY.has(primary) && !types.includes("meal_takeaway")) return "Cafe";
  if (CAFE_PRIMARY.has(primary)) return "Cafe";
  if (TAKEAWAY_PRIMARY.has(primary)) return "Takeaway";
  if (primary.endsWith("restaurant")) return "Restaurant";
  return undefined;
}

function nearestArea(loc) {
  let best = AREAS[0], bd = Infinity;
  for (const a of AREAS) {
    const d = (a.lat - loc.latitude) ** 2 + (a.lon - loc.longitude) ** 2;
    if (d < bd) { bd = d; best = a; }
  }
  return best.name;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(textQuery, pageToken) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.businessStatus,places.rating,places.userRatingCount,places.primaryType,places.types,places.location,nextPageToken",
    },
    body: JSON.stringify({ textQuery, locationRestriction: { rectangle: BOX }, pageSize: 20, ...(pageToken ? { pageToken } : {}) }),
  });
  if (!res.ok) throw new Error(`Places search ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const found = new Map();
let calls = 0;
for (const type of TYPES) {
  for (const term of TERMS[type] ?? []) {
    for (const area of AREAS) {
      let token;
      for (let page = 0; page < 2; page++) {
        let data;
        try {
          data = await search(`${term} in ${area.name}, London SW18`, token);
          calls++;
        } catch (e) {
          console.error(String(e.message));
          break;
        }
        for (const p of data.places ?? []) found.set(p.id, p);
        token = data.nextPageToken;
        if (!token) break;
        await sleep(300);
      }
    }
  }
}

const out = [];
for (const p of found.values()) {
  if (EXISTING.has(p.id)) continue;
  if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
  if (!(p.formattedAddress ?? "").includes("SW18")) continue;
  const name = p.displayName?.text ?? "";
  if (CHAINS.test(name)) continue;
  if ((p.rating ?? 0) < MIN_RATING || (p.userRatingCount ?? 0) < MIN_REVIEWS) continue;
  const type = classify(p);
  if (!type || !TYPES.includes(type)) continue;
  const score = ((p.rating ?? 0) * (p.userRatingCount ?? 0) + 4.0 * 20) / ((p.userRatingCount ?? 0) + 20);
  out.push({
    name,
    type,
    area: nearestArea(p.location),
    address: (p.formattedAddress ?? "").replace(/, UK$/, ""),
    placeId: p.id,
    rating: p.rating,
    reviews: p.userRatingCount,
    score: Math.round(score * 100) / 100,
  });
}
const final = [];
for (const t of TYPES) {
  final.push(...out.filter((o) => o.type === t).sort((a, b) => b.score - a.score).slice(0, LIMIT));
}
console.error(`Done: ${calls} Google searches, ${found.size} places seen, ${final.length} suggested.`);
console.log(JSON.stringify(final.map(({ score, ...rest }) => rest)));
