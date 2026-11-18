"use client";

import { setConsent } from "@/lib/analytics";

/** Footer link that clears the saved choice so the banner shows again. */
export default function CookieSettings() {
  return (
    <button type="button" className="linklike" onClick={() => setConsent(null)}>
      Cookie settings
    </button>
  );
}
