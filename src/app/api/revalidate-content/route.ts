import { revalidatePath, revalidateTag } from "next/cache";
import { CONTENTFUL_CACHE_TAG } from "@/lib/contentful";

/**
 * Called by a Contentful webhook on publish/unpublish/delete. Contentful is only fetched again after this runs.
 * The space is shared with The Messy Chef, so entries from other sites' content types are ignored.
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorised", { status: 401 });
  }
  let body: { sys?: { type?: string; contentType?: { sys?: { id?: string } } } } = {};
  try {
    body = await req.json();
  } catch {
    /* no body: treat as a manual refresh */
  }
  const type = body.sys?.contentType?.sys?.id;
  const isAsset = body.sys?.type === "Asset" || body.sys?.type === "DeletedAsset";
  if (type && !type.startsWith("sw18") && !isAsset) {
    return Response.json({ ok: true, ignored: type });
  }
  revalidateTag(CONTENTFUL_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return Response.json({ ok: true, refreshedAt: new Date().toISOString() });
}
