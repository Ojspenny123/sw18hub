import type { MetadataRoute } from "next";
import { getVenues } from "@/lib/contentful";
import { abs, bestCombos, bestSlug } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const venues = await getVenues();
  const statics: MetadataRoute.Sitemap = [
    { url: abs("/"), changeFrequency: "daily", priority: 1 },
    { url: abs("/places"), changeFrequency: "weekly", priority: 0.9 },
    { url: abs("/news"), changeFrequency: "daily", priority: 0.7 },
    { url: abs("/deals"), changeFrequency: "weekly", priority: 0.5 },
    { url: abs("/about"), changeFrequency: "yearly", priority: 0.4 },
  ];
  const best: MetadataRoute.Sitemap = bestCombos(venues).map((c) => ({
    url: abs(`/best/${bestSlug(c.type, c.area)}`),
    changeFrequency: "weekly",
    priority: c.area ? 0.8 : 0.85,
  }));
  const places: MetadataRoute.Sitemap = venues.map((v) => ({ url: abs(`/places/${v.slug}`), changeFrequency: "weekly", priority: 0.6 }));
  return [...statics, ...best, ...places];
}
