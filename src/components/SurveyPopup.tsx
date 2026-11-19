"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { analyticsAllowed, getConsent, track } from "@/lib/analytics";
import type { Survey } from "@/lib/pages";

const KEY = "sw18-survey";
const COOLDOWN_DAYS = 30;
const MAX = 50;

const recentlyAsked = () => {
  try {
    const t = Number(window.localStorage.getItem(KEY));
    return Boolean(t) && Date.now() - t < COOLDOWN_DAYS * 86400000;
  } catch {
    return false;
  }
};
const markAsked = () => {
  try {
    window.localStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* private mode: it may be asked again, which is harmless */
  }
};

/** Free text goes to Google Analytics, so strip anything that looks like an email address or phone number first. */
const clean = (s: string) =>
  s
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[removed]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[removed]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX);

/**
 * A small panel that slides in from the right after the visitor has been on the site for a set time (20 seconds by default): score 1 to 5, then an optional short comment.
 * Answers are sent to Google Analytics as events, so it only appears for people who accepted analytics cookies.
 */
export default function SurveyPopup({ survey }: { survey: Survey }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false); // mounted; `open` drives the slide
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [score, setScore] = useState(0);
  const [text, setText] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const path = () => window.location.pathname;

  // Shows once the visitor has been on the site for the set time. The clock starts on arrival and carries over between pages.
  const arrived = useRef(0);
  useEffect(() => {
    arrived.current = Date.now();
  }, []);
  useEffect(() => {
    if (shown || !analyticsAllowed() || recentlyAsked()) return;
    const id = window.setInterval(() => {
      if (Date.now() - arrived.current < survey.delaySeconds * 1000) return;
      // Wait until analytics is accepted and no other pop-up is open.
      if (getConsent() !== "granted" || document.querySelector("dialog[open]")) return;
      window.clearInterval(id);
      setShown(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
      track("survey_view", { page_path: path() });
    }, 700);
    return () => window.clearInterval(id);
  }, [survey.delaySeconds, pathname, shown]);

  const hide = () => {
    setOpen(false);
    window.setTimeout(() => setShown(false), 400);
  };
  const dismiss = () => {
    markAsked();
    if (step !== 3) track("survey_dismiss", { survey_step: step, page_path: path() });
    hide();
  };
  const next = () => {
    if (!score) return;
    track("survey_score", { survey_score: score, page_path: path() });
    markAsked();
    setStep(2);
  };
  const finish = (send: boolean) => {
    const comment = clean(text);
    if (send && comment) track("survey_comment", { survey_score: score, survey_comment: comment, page_path: path() });
    setStep(3);
    window.setTimeout(hide, 3000);
  };

  // Escape closes it, like any other panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && panel.current?.contains(document.activeElement) && dismiss();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  if (!shown) return null;
  return (
    <div ref={panel} className={`survey${open ? " in" : ""}`} role="dialog" aria-modal="false" aria-labelledby="survey-q">
      <button type="button" className="survey-x" onClick={dismiss} aria-label="Close survey">
        &times;
      </button>
      {step === 1 ? (
        <>
          <p className="survey-q" id="survey-q">
            {survey.question}
          </p>
          <div className="survey-scale" role="radiogroup" aria-labelledby="survey-q">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={score === n}
                aria-label={`${n} out of 5`}
                className={`survey-n${score === n ? " on" : ""}`}
                onClick={() => setScore(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="survey-ends" aria-hidden="true">
            <span>1 {survey.lowLabel}</span>
            <span>{survey.highLabel} 5</span>
          </div>
          <button type="button" className="btn small" onClick={next} disabled={!score}>
            Next
          </button>
        </>
      ) : null}
      {step === 2 ? (
        <>
          <label className="survey-q" id="survey-q" htmlFor="survey-text">
            {survey.followUp}
          </label>
          <input
            id="survey-text"
            className="survey-text"
            type="text"
            maxLength={MAX}
            value={text}
            placeholder={survey.placeholder}
            autoComplete="off"
            autoFocus
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && finish(true)}
          />
          <p className="survey-hint">
            {text.length}/{MAX}. Please don&apos;t include personal details.
          </p>
          <div className="survey-actions">
            <button type="button" className="btn small" onClick={() => finish(true)} disabled={!text.trim()}>
              Send
            </button>
            <button type="button" className="btn small outline" onClick={() => finish(false)}>
              Skip
            </button>
          </div>
        </>
      ) : null}
      {step === 3 ? (
        <p className="survey-q" id="survey-q" role="status">
          {survey.thanks}
        </p>
      ) : null}
    </div>
  );
}
