// Runs every Sunday at 03:00 UTC on the published (production) deploy.
// 1) marks the cached Google ratings/locations and the events calendar feeds as stale
// 2) visits the pages that use them once, so the single weekly refresh happens now, not on a visitor.
export default async () => {
  const base = process.env.URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) {
    console.log("Missing URL or REVALIDATE_SECRET - skipping");
    return;
  }
  const res = await fetch(`${base}/api/revalidate-google`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  console.log("revalidate:", res.status);
  if (!res.ok) return;
  for (const path of ["/places", "/", "/news"]) {
    const r = await fetch(`${base}${path}`);
    console.log("warm", path, r.status);
  }
};

export const config = { schedule: "0 3 * * 0" };
