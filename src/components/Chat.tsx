"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const PATH = /(\/(?:places|best|whats-on|news|deals|about)(?:\/[a-z0-9-]+)?)/g;

/** Turns site paths in an answer (like /places/amrutha) into links. Everything else stays plain text. */
function Linked({ text }: { text: string }) {
  return (
    <>
      {text.split(PATH).map((part, i) =>
        i % 2 === 1 ? (
          <Link key={i} href={part}>
            {part}
          </Link>
        ) : (
          part
        ),
      )}
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
              {m.role === "assistant" ? <Linked text={m.content} /> : m.content}
            </div>
          ))}
          {busy ? <div className="bubble bot muted">One moment...</div> : null}
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
