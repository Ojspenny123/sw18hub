"use client";

import { useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
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

  const tries = ["Best Sunday roast in Southfields", "What is on this weekend?", "Quiet cafe to work from", "Any deals nearby?"];

  return (
    <div className="split chatsplit">
      <div className="chat">
        <div className="msgs" aria-live="polite">
          {msgs.length === 0 ? <p className="muted">Ask about places, news, events or deals in SW18.</p> : null}
          {msgs.map((m, i) => (
            <div key={i} className={`bubble ${m.role === "user" ? "user" : "bot"}`}>
              {m.content}
            </div>
          ))}
          {busy ? <div className="bubble bot muted">Thinking...</div> : null}
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
          <input id="msg" value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="Ask about places, news, events or deals" />
          <button type="submit" className="btn" disabled={busy}>
            Send
          </button>
        </form>
        <p className="small muted note">
          Answers can be wrong. Check opening times with the venue.
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
