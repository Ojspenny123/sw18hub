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
  featured: boolean;
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
