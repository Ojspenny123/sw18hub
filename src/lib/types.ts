export const AREAS = ["Wandsworth Town", "Earlsfield", "Southfields", "Wandsworth Common"] as const;
export const VENUE_TYPES = ["Pub", "Bar", "Cafe", "Restaurant", "Takeaway"] as const;
export const FEATURES = ["Garden", "Dog-friendly", "Live sport", "Food served", "Family-friendly", "Outdoor seating"] as const;
export const NEWS_TOPICS = ["Council", "Transport", "Food and drink", "Community", "Planning"] as const;

export interface Venue {
  id: string;
  name: string;
  slug: string;
  type: string;
  area: string;
  googlePlaceId?: string;
  address?: string;
  lat?: number;
  lon?: number;
  website?: string;
  phone?: string;
  openingHours?: string;
  osmUrl?: string;
  photo?: { url: string; page?: string; credit: string };
  description?: string;
  features: string[];
  featured: boolean;
  image?: string;
}

export interface Rating {
  rating?: number;
  count?: number;
  openNow?: boolean;
  mapsUri?: string;
  lat?: number;
  lon?: number;
  photoUrl?: string;
  photoCredit?: string;
}

export interface VenueWithRating extends Venue {
  google?: Rating;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  topic: string;
  sourceName?: string;
  sourceUrl?: string;
  publishedAt: string;
  image?: string;
  /** Picture supplied by the publisher in its feed (used with their permission) and who to credit. */
  imageUrl?: string;
  imageCredit?: string;
  featured: boolean;
  /** Mentions or is tagged to one of our SW18 areas. */
  sw18?: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  venueName?: string;
  price?: string;
  link?: string;
  image?: string;
  /** Set for events pulled from an outside calendar feed (e.g. Putney.news). */
  source?: string;
  /** Neighbourhood outside SW18 (e.g. Clapham, Fulham). Set means the event is "nearby". */
  area?: string;
  /** Weekly events: "Every Saturday". All dates of one series share `series`. */
  repeats?: string;
  series?: string;
}

export interface Deal {
  id: string;
  headline: string;
  slug: string;
  businessName: string;
  category?: string;
  area?: string;
  discountText: string;
  code: string;
  terms?: string;
  validFrom?: string;
  validTo?: string;
  image?: string;
}

/** A pop-up shown when a page loads (Contentful type sw18Popup). Date and day rules are applied in the browser so pages can stay cached. */
export interface Popup {
  id: string;
  /** Changes whenever the entry is edited, so an edited pop-up is shown again to people who dismissed the old one. */
  version: string;
  heading: string;
  body: string;
  detail?: string;
  /** Address of the page on this site that the pop-up links to: /featured/<slug>. */
  slug?: string;
  imageUrl?: string;
  imageCredit?: string;
  /** Longer text for the page the pop-up links to. */
  pageText?: string;
  /** The button on that page, which links out to the organiser's own site. */
  linkLabel?: string;
  linkUrl?: string;
  showFrom?: string;
  showUntil?: string;
  showOnDays?: string[];
  frequency: "Once per visit" | "Once per day" | "Every page load";
  /** "Show it" in Contentful. */
  active: boolean;
}
