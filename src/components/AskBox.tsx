"use client";

import { useRouter } from "next/navigation";
import { ASK_KEY } from "@/lib/analytics";

/** Home page question box. The typed text is passed to the Ask page through session storage so it never appears in the page address (and so never reaches analytics). Without JavaScript it falls back to a normal form. */
export default function AskBox() {
  const router = useRouter();
  return (
    <form
      action="/ask"
      className="askbox"
      onSubmit={(e) => {
        const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        if (!q) return;
        try {
          window.sessionStorage.setItem(ASK_KEY, q.slice(0, 400));
        } catch {
          return; // storage blocked: let the normal form submit
        }
        e.preventDefault();
        router.push("/ask");
      }}
    >
      <label htmlFor="q" className="sr">
        Ask SW18
      </label>
      <input id="q" name="q" type="text" placeholder="Ask anything, e.g. pubs in Wandsworth" />
      <button type="submit" className="btn">
        Ask
      </button>
    </form>
  );
}
