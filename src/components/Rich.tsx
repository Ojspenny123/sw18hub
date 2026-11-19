import Link from "next/link";
import type { ReactNode } from "react";

/** Plain text with blank lines between paragraphs and [label](/address) links. */
export default function Rich({ text, className }: { text: string; className?: string }) {
  const para = (p: string, i: number) => {
    const parts: ReactNode[] = [];
    let last = 0;
    for (const m of p.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
      parts.push(p.slice(last, m.index));
      const href = m[2];
      parts.push(
        href.startsWith("/") ? (
          <Link key={`${i}-${m.index}`} href={href}>
            {m[1]}
          </Link>
        ) : (
          <a key={`${i}-${m.index}`} href={href} target="_blank" rel="noopener noreferrer">
            {m[1]}
            <span className="sr"> (opens in a new tab)</span>
          </a>
        ),
      );
      last = (m.index ?? 0) + m[0].length;
    }
    parts.push(p.slice(last));
    return (
      <p key={i} className={className}>
        {parts}
      </p>
    );
  };
  return <>{text.split(/\n\s*\n/).map(para)}</>;
}

