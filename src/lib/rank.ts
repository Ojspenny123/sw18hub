/**
 * Review-weighted score, so a handful of 5-star reviews cannot beat a very well reviewed 4.9.
 * It pulls each rating toward a typical Google rating (PRIOR_RATING) as if the place had PRIOR_REVIEWS
 * extra reviews at that rating. With many reviews the score is almost the plain rating.
 */
export const PRIOR_RATING = 4.4;
export const PRIOR_REVIEWS = 50;

export function rankScore(g?: { rating?: number; count?: number }): number {
  if (!g?.rating) return -1; // unrated places sort last
  const n = g.count ?? 0;
  return (n * g.rating + PRIOR_REVIEWS * PRIOR_RATING) / (n + PRIOR_REVIEWS);
}

export function byScore(a: { google?: { rating?: number; count?: number } }, b: { google?: { rating?: number; count?: number } }) {
  return rankScore(b.google) - rankScore(a.google) || (b.google?.count ?? 0) - (a.google?.count ?? 0);
}
