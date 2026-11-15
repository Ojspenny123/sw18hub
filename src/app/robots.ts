import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** Search and AI crawlers are welcome: the site wants to be found and quoted. Only the API is off limits. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
      // Named so the intent is explicit for AI search and answer engines.
      {
        userAgent: ["OAI-SearchBot", "ChatGPT-User", "GPTBot", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended"],
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
