"use client";

import { useEffect, useSyncExternalStore } from "react";
import Script from "next/script";
import { analyticsAllowed, CONSENT_EVENT, GA_ID, getConsent, setConsent, track, type Consent } from "@/lib/analytics";

function subscribe(cb: () => void) {
  window.addEventListener(CONSENT_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CONSENT_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
// Off (no banner, no script) on localhost and deploy previews. "unknown" on the server and during hydration, so the banner never flashes for people who already chose.
const useConsent = (): Consent | "unknown" => useSyncExternalStore(subscribe, () => (analyticsAllowed() ? getConsent() : "denied"), () => "unknown" as const);

export default function Analytics() {
  const consent = useConsent();

  // Count clicks on links that leave the site (news stories, venue websites, tickets, directions).
  useEffect(() => {
    if (consent !== "granted") return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !/^https?:$/.test(a.protocol) || a.host === window.location.host) return;
      track("outbound_click", {
        link_domain: a.hostname.replace(/^www\./, ""),
        link_url: a.href.slice(0, 200),
        link_text: (a.textContent || "").trim().slice(0, 80),
        page_path: window.location.pathname,
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [consent]);

  return (
    <>
      {consent === "granted" ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">{`
window.dataLayer = window.dataLayer || [];
window.gtag = function(){ window.dataLayer.push(arguments); };
gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
gtag('js', new Date());
gtag('config', '${GA_ID}', { allow_google_signals: false, allow_ad_personalization_signals: false });
`}</Script>
        </>
      ) : null}
      {consent === null ? (
        <div className="cookie-banner" role="dialog" aria-label="Cookies" aria-live="polite">
          <p>
            We use Google Analytics cookies to count visits and clicks so we can improve SW18 Hub. They are off unless you accept. No advertising cookies.{" "}
            <a href="/privacy">More detail</a>
          </p>
          <div className="cookie-actions">
            <button type="button" className="btn small" onClick={() => setConsent("granted")}>Accept analytics</button>
            <button type="button" className="btn small outline" onClick={() => setConsent("denied")}>No thanks</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
