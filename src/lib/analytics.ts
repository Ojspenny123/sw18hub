/**
 * Google Analytics 4. Free, loaded only after a visitor accepts analytics cookies (see components/Analytics.tsx).
 * The Measurement ID is public (it appears in the page source), so a fallback is fine; override with
 * NEXT_PUBLIC_GA_MEASUREMENT_ID in Netlify to point at a different property.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-XXKJE3FZLV";

export const CONSENT_KEY = "sw18-analytics-consent";
export const CONSENT_EVENT = "sw18-consent-change";
export type Consent = "granted" | "denied" | null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

export function getConsent(): Consent {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

/** Remove the GA cookies this site set (they live on the site's own domain). */
function clearGaCookies() {
  const names = document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => n === "_ga" || n.startsWith("_ga_") || n === "_gid");
  for (const n of names) document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function setConsent(v: Consent) {
  try {
    if (v) window.localStorage.setItem(CONSENT_KEY, v);
    else window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* private mode: the choice just lasts for this page */
  }
  if (v !== "granted") {
    window[`ga-disable-${GA_ID}`] = true;
    clearGaCookies();
  } else {
    window[`ga-disable-${GA_ID}`] = false;
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/** Send a custom event. Does nothing unless the visitor has accepted analytics. Never pass personal data or typed text. */
export function track(name: string, params: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function" || getConsent() !== "granted") return;
  window.gtag("event", name, params);
}
