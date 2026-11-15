import { getStore } from "@netlify/blobs";
import { byScore } from "./rank";
import type { Rating, Venue, VenueWithRating } from "./types";

/**
 * Google Places data is a WEEKLY SNAPSHOT, stored outside the Next.js cache so
 * deploys, rebuilds and page re-renders never trigger Google calls.
 *
 *  - Pages only READ the snapshot (withRatings). They never call Google.
 *  - The only code that calls Google is refreshGoogle(), which runs from the
 *    authenticated /api/revalidate-google route (Sunday job, or by hand) and
 *    skips itself if the snapshot is under 6 days old (unless force is set).
 *  - GOOGLE_API_DISABLED=1 turns every Google call off.
 */
const KEY = process.env.GOOGLE_MAPS_API_KEY;
export const GOOGLE_CACHE_TAG = "google";
const MIN_AGE_MS = 6 * 24 * 60 * 60 * 1000;
const FIELDS =
  "rating,userRatingCount,currentOpeningHours.openNow,googleMapsUri,location,businessStatus,photos.name,photos.authorAttributions.displayName";

export interface Snapshot {
  fetchedAt: string;
  ratings: Record<string, Rating>;
}

let memo: { at: number; snap: Snapshot | null } | undefined;

function store() {
  try {
    return getStore({ name: "sw18-google", consistency: "eventual" });
  } catch {
    return undefined; // not running on Netlify (local dev)
  }
}

export async function readSnapshot(): Promise<Snapshot | null> {
  if (memo && Date.now() - memo.at < 5 * 60 * 1000) return memo.snap;
  let snap: Snapshot | null = null;
  try {
    snap = ((await store()?.get("ratings", { type: "json" })) as Snapshot | null) ?? null;
  } catch {
    snap = null;
  }
  memo = { at: Date.now(), snap };
  return snap;
}

export async function withRatings(venues: Venue[]): Promise<VenueWithRating[]> {
  const snap = await readSnapshot();
  return venues.map((v) => ({ ...v, google: v.googlePlaceId ? snap?.ratings[v.googlePlaceId] : undefined }));
}

export function byRating(a: VenueWithRating, b: VenueWithRating) {
  return byScore(a, b) || a.name.localeCompare(b.name);
}

async function fetchOne(placeId: string): Promise<Rating | undefined> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": KEY as string, "X-Goog-FieldMask": FIELDS },
    cache: "no-store",
  });
  if (!res.ok) return undefined;
  const d = await res.json();
  if (d.businessStatus && d.businessStatus !== "OPERATIONAL") return undefined;
  const photo = d.photos?.[0];
  let photoUrl: string | undefined;
  if (photo?.name) {
    const p = await fetch(`https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=600&skipHttpRedirect=true`, {
      headers: { "X-Goog-Api-Key": KEY as string },
      cache: "no-store",
    });
    if (p.ok) photoUrl = (await p.json()).photoUri;
  }
  return {
    photoUrl,
    photoCredit: photoUrl ? photo?.authorAttributions?.[0]?.displayName : undefined,
    rating: d.rating,
    count: d.userRatingCount,
    openNow: d.currentOpeningHours?.openNow,
    mapsUri: d.googleMapsUri,
    lat: d.location?.latitude,
    lon: d.location?.longitude,
  };
}

/** The ONLY place that calls Google. Returns what it did. */
export async function refreshGoogle(placeIds: string[], force = false) {
  if (process.env.GOOGLE_API_DISABLED === "1") return { status: "disabled" as const };
  if (!KEY) return { status: "no-key" as const };
  const s = store();
  if (!s) return { status: "no-store" as const }; // never call Google if we cannot save the result
  const current = (await s.get("ratings", { type: "json" }).catch(() => null)) as Snapshot | null;
  if (!force && current && Date.now() - new Date(current.fetchedAt).getTime() < MIN_AGE_MS) {
    return { status: "fresh" as const, fetchedAt: current.fetchedAt };
  }
  const ids = [...new Set(placeIds)];
  const ratings: Record<string, Rating> = {};
  let calls = 0;
  for (let i = 0; i < ids.length; i += 8) {
    await Promise.all(
      ids.slice(i, i + 8).map(async (id) => {
        try {
          calls += 1;
          const r = await fetchOne(id);
          if (r) ratings[id] = r;
          else if (current?.ratings[id]) ratings[id] = current.ratings[id]; // keep last good value
        } catch {
          if (current?.ratings[id]) ratings[id] = current.ratings[id];
        }
      }),
    );
  }
  const snap: Snapshot = { fetchedAt: new Date().toISOString(), ratings };
  await s.setJSON("ratings", snap);
  memo = undefined;
  return { status: "refreshed" as const, venues: ids.length, withData: Object.keys(ratings).length, placeCalls: calls, fetchedAt: snap.fetchedAt };
}
