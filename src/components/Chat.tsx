"use client";

import { searchTerm, track } from "@/lib/analytics";
import { useEffect, useRef, useState } from "react";
import RichText from "./RichText";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

/** Shows an answer as if it is being typed. Pending links are held back until they are complete. */
function Typed({ text, animate, onTick }: { text: string; animate: boolean; onTick: () => void }) {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [n, setN] = useState(animate && !reduced ? 0 : text.length);
  useEffect(() => {
    if (n >= text.length) return;
    // About 90 characters a second, faster for long answers so nothing takes more than ~4 seconds.
    const perTick = Math.max(2, Math.ceil(Math.max(90, text.length / 4) * 0.03));
    const t = setTimeout(() => setN((x) => Math.min(text.length, x + perTick)), 30);
    return () => clearTimeout(t);
  }, [n, text]);
  useEffect(() => {
    onTick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);
  let shown = text.slice(0, n);
  const typing = n < text.length;
  if (typing) {
    const open = shown.lastIndexOf("[");
    if (open !== -1 && !/^\[[^\]]*\]\([^)]*\)/.test(shown.slice(open))) shown = shown.slice(0, open);
  }
  return (
    <>
      <RichText text={shown} />
      {typing ? <span className="caret" aria-hidden="true" /> : null}
    </>
  );
}

export default function Chat({ initialQuestion }: { initialQuestion?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    // Question text is shortened and emails/phone numbers are removed first (see /privacy).
    track("chatbot_question", { question_number: next.filter((m) => m.role === "user").length, question_text: searchTerm(q) });
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMsgs([...next, { role: "assistant", content: data.answer ?? data.error ?? "Sorry, something went wrong." }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Sorry, I could not reach the server. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialQuestion && !started.current) {
      started.current = true;
      send(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, busy]);

  const tries = ["Best pubs with a garden", "What's on this week?", "A quiet cafe to work from in Southfields", "Where can I get a good curry in Earlsfield?"];

  return (
    <div className="split chatsplit">
      <div className="chat">
        <div className="msgs" aria-live="polite">
          {msgs.length === 0 ? (
            <div className="bubble bot">Hi! I&apos;m Ask SW18. I can help you find somewhere to eat or drink, see what&apos;s on, or catch up on local news in Wandsworth, Earlsfield and Southfields. What are you after?</div>
          ) : null}
          {msgs.map((m, i) => (
            <div key={i} className={`bubble ${m.role === "user" ? "user" : "bot"}`}>
              {m.role === "assistant" ? (
                <Typed text={m.content} animate={i === msgs.length - 1 && i > 0} onTick={() => endRef.current?.scrollIntoView({ block: "end" })} />
              ) : (
                m.content
              )}
            </div>
          ))}
          {busy ? (
            <div className="bubble bot" aria-label="Typing">
              <span className="dots" aria-hidden="true"><i /><i /><i /></span>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <label htmlFor="msg" className="sr">
            Message
          </label>
          <input id="msg" value={input} onChange={(e) => setInput(e.target.value)} maxLength={400} placeholder="Ask me about SW18" />
          <button type="submit" className="btn" disabled={busy}>
            Send
          </button>
        </form>
        <p className="small muted note">
          I only know SW18 and what is on this site. Answers can be wrong, so check opening times with the venue.
        </p>
      </div>
      <div className="side">
        <div className="panel">
          <div style={{ fontWeight: 600 }}>Try asking</div>
          {tries.map((t) => (
            <button key={t} type="button" className="try" onClick={() => send(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
