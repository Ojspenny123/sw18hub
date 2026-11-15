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

`venue`, `newsArticle`, `event`, `business`, `deal`. Google ratings are fetched live using the venue's `googlePlaceId`; they are not stored in Contentful.

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
