import { revalidateTag } from "next/cache";
import { GOOGLE_CACHE_TAG } from "@/lib/google";

/** Called once a week (Sunday) by the Netlify scheduled function. Marks cached Google data as stale. */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorised", { status: 401 });
  }
  revalidateTag(GOOGLE_CACHE_TAG, "max");
  return Response.json({ ok: true, refreshedAt: new Date().toISOString() });
}
