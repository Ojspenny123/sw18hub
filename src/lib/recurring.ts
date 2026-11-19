import type { EventItem } from "./types";
import { addDays, dayKey, weekday } from "./event-types";

/**
 * Weekly events that happen all year (parkruns). Dates are worked out here, so there is nothing to
 * update each week. Times and places come from the organisers' own pages (linked on each event).
 * To add one, add a line to WEEKLY. weekday: 0 = Sunday ... 6 = Saturday.
 */
interface Weekly {
  id: string;
  title: string;
  weekday: number;
  time: string; // London time, HH:MM
  venueName: string;
  area?: string; // outside SW18
  description: string;
  link: string;
  price?: string;
}

const COUNCIL_PARKRUN = "https://www.wandsworth.gov.uk/leisure-and-culture/sport-and-fitness/sports-offer/parkrun/";
const CHECK = " Events are sometimes cancelled, so check the parkrun page before you go.";

const WEEKLY: Weekly[] = [
  {
    id: "tooting-parkrun",
    title: "Tooting Common parkrun",
    weekday: 6,
    time: "09:00",
    venueName: "Tooting Common",
    area: "Tooting",
    description: "Free weekly timed 5k. Walk, jog or run. Register once on parkrun.org.uk and bring your barcode." + CHECK,
    link: "https://www.parkrun.org.uk/tootingcommon/",
    price: "Free",
  },
  {
    id: "battersea-parkrun",
    title: "Battersea parkrun",
    weekday: 6,
    time: "09:00",
    venueName: "Battersea Park",
    area: "Battersea",
    description: "Free weekly timed 5k in Battersea Park. Register once on parkrun.org.uk and bring your barcode." + CHECK,
    link: COUNCIL_PARKRUN,
    price: "Free",
  },
  {
    id: "clapham-parkrun",
    title: "Clapham Common parkrun",
    weekday: 6,
    time: "09:00",
    venueName: "Clapham Common",
    area: "Clapham",
    description: "Free weekly timed 5k, starting near Broomwood Road. Register once on parkrun.org.uk and bring your barcode." + CHECK,
    link: "https://www.parkrun.org.uk/claphamcommon/",
    price: "Free",
  },
  {
    id: "fulham-parkrun",
    title: "Fulham Palace parkrun",
    weekday: 6,
    time: "09:00",
    venueName: "Bishop's Park",
    area: "Fulham",
    description: "Free weekly timed 5k in Bishop's Park, with coffee at the Fulham Palace cafe afterwards. Register once on parkrun.org.uk and bring your barcode." + CHECK,
    link: "https://www.parkrun.org.uk/fulhampalace/",
    price: "Free",
  },
  {
    id: "tooting-junior-parkrun",
    title: "Tooting Common junior parkrun",
    weekday: 0,
    time: "09:00",
    venueName: "Tooting Common",
    area: "Tooting",
    description: "Free weekly timed 2k for ages 4 to 14. Parents can run too. Register once on parkrun.org.uk." + CHECK,
    link: COUNCIL_PARKRUN,
    price: "Free",
  },
  {
    id: "battersea-junior-parkrun",
    title: "Battersea junior parkrun",
    weekday: 0,
    time: "09:00",
    venueName: "Battersea Park",
    area: "Battersea",
    description: "Free weekly timed 2k for ages 4 to 14. Register once on parkrun.org.uk." + CHECK,
    link: "https://www.parkrun.org.uk/battersea-juniors/course/",
    price: "Free",
  },
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** London wall-clock time on a given day, as a UTC ISO string. */
function londonIso(key: string, time: string): string {
  const guess = new Date(`${key}T${time}:00Z`);
  const part = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", timeZoneName: "shortOffset" })
    .formatToParts(guess)
    .find((p) => p.type === "timeZoneName")?.value; // "GMT" or "GMT+1"
  const m = part?.match(/GMT([+-]\d+)?/);
  const hours = m?.[1] ? parseInt(m[1], 10) : 0;
  return new Date(guess.getTime() - hours * 3600000).toISOString();
}

const WEEKS_AHEAD = 6;

export function getRecurringEvents(now = new Date()): EventItem[] {
  const today = dayKey(now.toISOString());
  const out: EventItem[] = [];
  for (const w of WEEKLY) {
    for (let i = 0; i < WEEKS_AHEAD * 7; i++) {
      const key = addDays(today, i);
      if (weekday(key) !== w.weekday) continue;
      const startsAt = londonIso(key, w.time);
      if (Date.parse(startsAt) < now.getTime() - 2 * 3600000) continue; // already finished today
      out.push({
        id: `weekly-${w.id}-${key}`,
        title: w.title,
        slug: `${w.id}-${key}`,
        description: w.description,
        startsAt,
        venueName: w.venueName,
        price: w.price,
        link: w.link,
        area: w.area,
        repeats: `Every ${DAY_NAMES[w.weekday]}`,
        series: w.id,
      });
    }
  }
  return out;
}
