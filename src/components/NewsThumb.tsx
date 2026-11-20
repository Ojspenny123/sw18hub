import type { CSSProperties } from "react";
import type { NewsArticle } from "@/lib/types";

/* Simple line icons, one per topic. Used when a story has no photo of its own. */
const ICONS: Record<string, string> = {
  Council: "M3 21h18M5 21V10m4 11V10m6 11V10m4 11V10M2 10l10-7 10 7H2z",
  Transport: "M5 16V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v10M5 16h14M5 16v3m14-3v3M5 11h14M8 19h.01M16 19h.01",
  "Food and drink": "M6 2v8a3 3 0 0 0 6 0V2M9 2v20M18 2c-2 2-3 5-3 8s1 4 3 4v8",
  Community: "M16 11a3 3 0 1 0 0-6M8 11a3 3 0 1 0 0-6M2 20c0-3 3-5 6-5s6 2 6 5M16 15c3 0 6 2 6 5",
  Planning: "M3 21h18M6 21V8l6-5 6 5v13M10 21v-6h4v6",
};
const COLOURS: Record<string, string> = {
  Council: "var(--yellow-pale)",
  Transport: "var(--fill)",
  "Food and drink": "var(--yellow)",
  Community: "var(--pink)",
  Planning: "var(--yellow-pale)",
};

export default function NewsThumb({ n, className, width, style }: { n: NewsArticle; className: string; width: number; style?: CSSProperties }) {
  if (n.imageUrl) {
    return (
      <div className={className} style={{ ...style, position: "relative", overflow: "hidden" }}>
        {/* The publisher's own picture, shown with their permission and credited in the alt text. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={n.imageUrl} alt={n.imageCredit ? `Image: ${n.imageCredit}` : ""} loading="lazy" referrerPolicy="no-referrer" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  if (n.image) {
    return <div className={className} style={{ ...style, backgroundImage: `url(${n.image}?w=${width}&fm=webp)` }} role={n.imageCredit ? "img" : undefined} aria-label={n.imageCredit ? `Image: ${n.imageCredit}` : undefined} />;
  }
  const topic = n.topic in ICONS ? n.topic : "Community";
  const onPink = topic === "Community";
  return (
    <div className={className} style={{ ...style, background: COLOURS[topic], display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
      <svg width="40%" height="40%" style={{ maxWidth: 96, maxHeight: 96 }} viewBox="0 0 24 24" fill="none" stroke={onPink ? "#fff" : "var(--pink)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={ICONS[topic]} />
      </svg>
    </div>
  );
}
