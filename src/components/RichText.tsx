import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Renders the chatbot's tiny format: blank-line paragraphs, "- " list items and [label](/site-path) links.
 * Anything else is shown as plain text, and only links to pages on this site are ever made clickable.
 */
const SITE_PATH = /^\/(?:places|best|whats-on|news|deals|about|ask)(?:\/[a-z0-9-]+)?$/;
const INLINE = /\[([^\]]{1,80})\]\(([^)\s]{1,120})\)|(\/(?:places|best|whats-on|news|deals|about)(?:\/[a-z0-9-]+)?)(?![a-z0-9/-])/g;

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const [, label, href, bare] = m;
    if (label && href) {
      out.push(SITE_PATH.test(href) ? <Link key={`${keyBase}-${i}`} href={href}>{label}</Link> : label);
    } else if (bare) {
      // A bare path slipped through: show a friendly label rather than the address.
      out.push(<Link key={`${keyBase}-${i}`} href={bare}>View page</Link>);
    }
    last = at + m[0].length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter((l) => l.trim());
        if (!lines.length) return null;
        // A run of "- " lines is a list; any other lines are paragraphs.
        const parts: ReactNode[] = [];
        let list: string[] = [];
        const flush = () => {
          if (!list.length) return;
          const items = list;
          list = [];
          parts.push(
            <ul key={`ul-${bi}-${parts.length}`}>
              {items.map((it, li) => (
                <li key={li}>{inline(it, `li-${bi}-${li}`)}</li>
              ))}
            </ul>,
          );
        };
        lines.forEach((l, li) => {
          const m = l.match(/^\s*[-•]\s+(.*)$/);
          if (m) list.push(m[1]);
          else {
            flush();
            parts.push(<p key={`p-${bi}-${li}`}>{inline(l.trim(), `p-${bi}-${li}`)}</p>);
          }
        });
        flush();
        return <div key={bi} className="rt">{parts}</div>;
      })}
    </>
  );
}
