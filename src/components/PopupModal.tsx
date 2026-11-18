"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import type { Popup } from "@/lib/types";

const londonParts = () => {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now); // YYYY-MM-DD
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long" }).format(now);
  return { date, day };
};

function due(p: Popup, today: { date: string; day: string }): boolean {
  if (p.showFrom && today.date < p.showFrom.slice(0, 10)) return false;
  if (p.showUntil && today.date > p.showUntil.slice(0, 10)) return false;
  if (p.showOnDays?.length && !p.showOnDays.includes(today.day)) return false;
  return true;
}

/** Remembers a dismissal in the browser. A blocked store just means the pop-up can show again, which is harmless. */
function alreadySeen(p: Popup, today: string): boolean {
  if (p.frequency === "Every page load") return false;
  try {
    const key = `sw18-popup-${p.id}-${p.version}`;
    if (p.frequency === "Once per day") return window.localStorage.getItem(key) === today;
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markSeen(p: Popup, today: string) {
  try {
    const key = `sw18-popup-${p.id}-${p.version}`;
    if (p.frequency === "Once per day") window.localStorage.setItem(key, today);
    else if (p.frequency === "Once per visit") window.sessionStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

/** Shows the first Contentful pop-up that is due today, once the page has loaded. */
export default function PopupModal({ popups }: { popups: Popup[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [popup, setPopup] = useState<Popup | null>(null);
  const today = useRef("");

  useEffect(() => {
    const t = londonParts();
    today.current = t.date;
    const p = popups.find((x) => due(x, t) && !alreadySeen(x, t.date));
    if (!p) return;
    const id = window.setTimeout(() => setPopup(p), 600); // let the page settle first
    return () => window.clearTimeout(id);
  }, [popups]);

  useEffect(() => {
    const d = ref.current;
    if (!popup || !d || d.open) return;
    d.showModal();
    markSeen(popup, today.current);
    track("popup_view", { popup_id: popup.id });
  }, [popup]);

  if (!popup) return null;
  const close = () => ref.current?.close();

  return (
    <dialog
      ref={ref}
      className="popup"
      aria-labelledby="popup-title"
      onClose={() => setPopup(null)}
      onClick={(e) => {
        if (e.target === ref.current) close(); // click on the dimmed backdrop
      }}
    >
      <div className="popup-card">
        <button type="button" className="popup-x" onClick={close} aria-label="Close">
          &times;
        </button>
        <h2 id="popup-title">{popup.heading}</h2>
        <p>{popup.body}</p>
        {popup.detail ? <p className="popup-detail">{popup.detail}</p> : null}
        <div className="popup-actions">
          {popup.linkUrl && popup.linkLabel ? (
            <a
              className="btn"
              href={popup.linkUrl}
              {...(popup.linkUrl.startsWith("/") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              onClick={() => track("popup_click", { popup_id: popup.id })}
            >
              {popup.linkLabel}
            </a>
          ) : null}
          <button type="button" className="btn outline" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
