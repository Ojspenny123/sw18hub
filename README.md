# SW18 Hub

A local hub for SW18 (Wandsworth, Earlsfield, Southfields): top-rated places on a map, local news and events, deals (phase 2) and an "Ask SW18" chatbot.

Built with Next.js (App Router, TypeScript), Contentful for content, Google Places and Maps for ratings and the map, and the Claude API for the chatbot. Hosted on Netlify.

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
| `GOOGLE_MAPS_API_KEY` | Ratings, review counts, open now (Places API New) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | The map (Maps JavaScript API) |
| `ANTHROPIC_API_KEY` | The Ask SW18 chatbot |

Set these in Netlify under Site configuration, Environment variables.

## Content model (Contentful)

`sw18Venue`, `sw18NewsArticle`, `sw18Event`, `sw18Business`, `sw18Deal` (the space is shared with another site, so SW18 only reads these types and entries tagged `siteSw18Hub`; see `CONTENT_TYPES` in `src/lib/contentful.ts`). Google ratings are fetched live using the venue's `googlePlaceId`; they are not stored in Contentful.

## Forms

The email list and business interest forms use Netlify Forms (`public/__forms.html` lets Netlify detect them). Submissions appear in the Netlify dashboard under Forms.

## Adding Google Place IDs to venues

After creating venues in Contentful, run this once on your own computer (never commit keys):

```bash
GOOGLE_MAPS_API_KEY=... CONTENTFUL_SPACE_ID=rfvqnggtcs8w CONTENTFUL_MANAGEMENT_TOKEN=... \
  node scripts/enrich-venues.mjs           # dry run
GOOGLE_MAPS_API_KEY=... CONTENTFUL_SPACE_ID=rfvqnggtcs8w CONTENTFUL_MANAGEMENT_TOKEN=... \
  node scripts/enrich-venues.mjs --write   # saves and publishes
```

It only saves matches that look right and skips venues Google marks as closed. Check the lines marked `CHECK`. Only the Place ID is stored: ratings, open now and map position are fetched live, because Google's terms limit storing them.

## Google data: one refresh a week
Google Places is called by one thing only: `refreshGoogle()` in `src/lib/google.ts`, run from `POST /api/revalidate-google` (needs `REVALIDATE_SECRET`). The Netlify scheduled function `netlify/functions/weekly-refresh.mjs` calls it every Sunday at 03:00 UTC. Results are saved as one snapshot in Netlify Blobs, so deploys, rebuilds and page renders never call Google: pages only read the snapshot. The refresh skips itself if the snapshot is under 6 days old, and never calls Google if it cannot save the result. Set `GOOGLE_API_DISABLED=1` in Netlify to switch every Google call off. The map (Maps JavaScript API, billed per load) only loads when a visitor taps "Show map". To refresh by hand: `curl -X POST -H "Authorization: Bearer $REVALIDATE_SECRET" "https://YOUR-SITE/api/revalidate-google?force=1"`. `/api/status` shows when the snapshot was taken. The same Sunday job refreshes the events calendars (`src/lib/events.ts`).

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
