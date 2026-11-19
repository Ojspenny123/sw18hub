import type { EventItem } from "./types";
import { addDays, dayKey, weekday } from "./event-types";

/**
 * Weekly events that happen all year (parkruns). Dates are worked out here, so there is nothing to
 * update each week. Times and places come from the organisers' own pages (linked on each event).
 * To add one, add a line to WEEKLY. weekday: 0 = Sunday ... 6 = Saturday.
 */
/** Photos from Wikimedia Commons (Geograph), all CC BY-SA 2.0. Credit is shown wherever the photo is used. */
export interface Photo {
  image: string;
  imageCredit: string;
  imageCreditUrl: string;
  imageLicence: string;
  imageLicenceUrl: string;
}
const BY_SA = "https://creativecommons.org/licenses/by-sa/2.0/";
function commons(file: string, author: string): Photo {
  const f = file.replace(/ /g, "_");
  return {
    image: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f)}?width=640`,
    imageCredit: `${author} / Wikimedia Commons`,
    imageCreditUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f)}`,
    imageLicence: "CC BY-SA 2.0",
    imageLicenceUrl: BY_SA,
  };
}
export const PHOTOS = {
  tooting: commons("Tooting Bec Common - geograph.org.uk - 3844877.jpg", "Bill Boaden"),
  battersea: commons("Central Avenue, Battersea Park - geograph.org.uk - 2994831.jpg", "Paul Gillett"),
  clapham: commons("Clapham Common, bandstand - geograph.org.uk - 1401957.jpg", "Mike Faherty"),
  fulham: commons("Mowing the lawn at Fulham Palace - geograph.org.uk - 1896528.jpg", "David Hawgood"),
  wandsworthCommon: commons("Wandsworth Common pond at sunset - geograph.org.uk - 6324116.jpg", "Robert Eva"),
};

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
  photo: Photo;
}

const COUNCIL_PARKRUN = "https://www.wandsworth.gov.uk/leisure-and-culture/sport-and-fitness/sports-offer/parkrun/";
const CHECK = " Events are sometimes cancelled, so check the parkrun page before you go.";

const WEEKLY: Weekly[] = [
  {
    id: "tooting-parkrun",
    photo: PHOTOS.tooting,
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
    photo: PHOTOS.battersea,
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
    photo: PHOTOS.clapham,
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
    photo: PHOTOS.fulham,
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
    photo: PHOTOS.tooting,
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
    photo: PHOTOS.battersea,
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
        ...w.photo,
        repeats: `Every ${DAY_NAMES[w.weekday]}`,
        series: w.id,
      });
    }
  }
  return out;
}

/** Regular run clubs: no fixed dates, so they live in their own tab rather than the calendar. */
export interface RunClub {
  id: string;
  name: string;
  when: string;
  place: string;
  area?: string; // outside SW18
  description: string;
  link: string;
  photo: Photo;
}

export const RUN_CLUBS: RunClub[] = [
  {
    id: "wandsworth-run-club",
    name: "Wandsworth Run Club",
    when: "Every Thursday and Sunday",
    place: "Sambrook's Brewery Taproom, Wandsworth",
    description: "Friendly social group runs from the taproom, finishing back at the bar. Check the page for start times.",
    link: "https://sambrooksbrewery.co.uk/blogs/whats-on/wandsworth-run-club",
    photo: PHOTOS.wandsworthCommon,
  },
  {
    id: "goodgym-wandsworth",
    name: "GoodGym Wandsworth",
    when: "Every Monday, 6.30pm",
    place: "Battersea Arts Centre",
    area: "Battersea",
    description: "Free group run that helps a local community project on the way, back within 90 minutes. New runners welcome.",
    link: "https://www.goodgym.org/areas/wandsworth/group-runs",
    photo: PHOTOS.battersea,
  },
  {
    id: "tooting-run-club",
    name: "Tooting Run Club",
    when: "Weekly, mostly Sundays",
    place: "Tooting Bec Athletics Track",
    area: "Tooting",
    description: "Free, volunteer-led, 18 and over. Tickets for each session go live on Eventbrite every Friday at 10am. Updates are on their Instagram.",
    link: "https://www.eventbrite.be/o/42553815063",
    photo: PHOTOS.tooting,
  },
  {
    id: "wandsworth-common-free-running-club",
    name: "Free Running Club, Wandsworth Common",
    when: "Weekly (check the listing for day and time)",
    place: "Skylark Cafe, Dorlcote Road, SW18 3RT",
    description: "Free weekly club led by a personal trainer and coach. No commitment, just turn up. Listed on the NHS directory, so confirm details before you go.",
    link: "https://www.nhs.uk/services/service-directory/free-running-club/N10438650",
    photo: PHOTOS.wandsworthCommon,
  },
  {
    id: "runthrough-clapham",
    name: "RunThrough Running Club, Clapham",
    when: "Every Monday, 7pm",
    place: "The Windmill, Clapham Common South Side, SW4 9DE",
    area: "Clapham",
    description: "Free, all paces welcome. Group warm-up, then an interval session on the common of up to 30 minutes, led by a coach.",
    link: "https://new.runthrough.co.uk/club",
    photo: PHOTOS.clapham,
  },
  {
    id: "clapham-runners",
    name: "Clapham Runners",
    when: "Tuesdays 8pm (track), Thursdays 7pm (Clapham Common)",
    place: "Battersea Millennium Arena and Clapham Common",
    area: "Clapham",
    description: "Friendly club with coached speed work on the track and a group interval session on the common. Try a few sessions before joining. Their site has no date on it, so check with them first.",
    link: "https://claphamrunners.com/sessions/",
    photo: PHOTOS.battersea,
  },
];
