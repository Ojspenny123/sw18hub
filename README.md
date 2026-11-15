# SW18 Hub

A local hub for SW18 (Wandsworth, Earlsfield, Southfields): top-rated places on a map, local news and events, deals (phase 2) and an "Ask SW18" chatbot.

Built with Next.js (App Router, TypeScript), Contentful for content and the Claude API for the chatbot. Hosted on Netlify.

## Run locally

```bash
cp .env.example .env.local   # fill in the values you have
npm install
npm run dev
```

The site works with no keys at all and shows empty states. Add keys to switch features on.

## Environment variables

| Variable | Needed for |
|---|---|
| `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN` | All content (places, news, events, deals) |
| `ANTHROPIC_API_KEY` | The Ask SW18 chatbot |

Set these in Netlify under Site configuration, Environment variables.

## Content model (Contentful)

`sw18Venue`, `sw18NewsArticle`, `sw18Event`, `sw18Business`, `sw18Deal` (the space is shared with another site, so SW18 only reads these types and entries tagged `siteSw18Hub`; see `CONTENT_TYPES` in `src/lib/contentful.ts`). No Google APIs are called anywhere (they were removed to avoid charges).

## Forms

The email list and business interest forms use Netlify Forms (`public/__forms.html` lets Netlify detect them). Submissions appear in the Netlify dashboard under Forms.

## Weekly refresh

Events and news are cached and only refreshed once a week, on Sunday at 03:00 UTC, by the Netlify scheduled function `netlify/functions/weekly-refresh.mjs`. It calls `/api/revalidate-google`, then visits `/news` and `/`. Set `REVALIDATE_SECRET` in Netlify (any long random string). The same Sunday job refreshes the events calendars (`src/lib/events.ts`): Putney.news (with their agreement), filtered to SW18 mentions, plus any feeds in `EVENT_ICAL_FEEDS`. Events added by hand in Contentful show first.

## Local news (RSS)

`src/lib/rss.ts` pulls headlines from public RSS feeds (South West Londoner, South London News, Putney.news Southfields and Wandsworth Town). It's free (no API key). Feeds are re-fetched at most every 3 hours. Only the headline, a short snippet and a link back to the publisher are shown. To add or remove a source, edit `NEWS_FEEDS`. Stories added by hand in Contentful (`sw18NewsArticle`) still work and appear alongside, with featured ones on top.

## SEO and GEO

- Every page has its own title, description and canonical URL (`metadataBase` comes from `NEXT_PUBLIC_SITE_URL`, falling back to Netlify's `URL`). Set `NEXT_PUBLIC_SITE_URL` when you add a custom domain.
- `/places/[slug]` is a page per venue and `/best/[type]-in-[area]` ranks places (for example `/best/cafes-in-earlsfield`). Both are built on first visit and then cached.
- Structured data (JSON-LD): WebSite and Organization on every page, a local business type plus breadcrumbs on venue pages, ItemList and FAQPage on ranking pages, Event on the news page. Google ratings are deliberately not marked up as reviews.
- `/sitemap.xml`, `/robots.txt` (search and AI crawlers allowed, `/api/` blocked) and `/llms.txt` are generated from Contentful.
- `/about` explains how places are ranked, which helps people and AI assistants trust and cite the site.

## Ask SW18 chatbot

`/api/ask` answers only from what is on the site (places and Google ratings, SW18 news, events, deals), built by `src/lib/ask-context.ts`. Anything off-topic gets a friendly "I only know SW18". Cost controls: Haiku model, questions capped at 400 characters, answers capped at 320 tokens, only the last 6 messages sent, the site data is prompt-cached, same-site requests only, and per-visitor and daily limits (`src/lib/ratelimit.ts`, in memory, so best-effort). Set `ANTHROPIC_API_KEY` in Netlify and a monthly spend limit in the Anthropic Console; that limit is the real cap.

## Map and venue info (free, no paid APIs)
The site makes no Google calls. The map is Leaflet with OpenStreetMap tiles (no key). Venue positions, opening hours and phone numbers come from OpenStreetMap, looked up once by `scripts/osm-lookup.mjs` (run by the GitHub Action `osm-venues`, or `node scripts/osm-lookup.mjs`) and saved in `data/venue-osm.json`; the site only reads that file, so nothing is fetched at runtime. Venues not found in OpenStreetMap are listed under `unmatched` in that file and simply do not appear on the map. To add a venue by hand, add `lat` and `lon` in the Contentful `location` field (it overrides the OpenStreetMap value). Map data (c) OpenStreetMap contributors.
