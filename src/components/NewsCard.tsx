import NewsThumb from "./NewsThumb";
import { timeAgo } from "@/lib/format";
import type { NewsArticle } from "@/lib/types";

/** Compact news tile: picture or hand-drawn topic icon on top, then topic, headline and source. */
export default function NewsCard({ n }: { n: NewsArticle }) {
  const external = Boolean(n.sourceUrl);
  return (
    <a
      href={n.sourceUrl ?? "/news"}
      className="card ncard"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <NewsThumb n={n} className="ntile" width={600} />
      <div className="ncard-body">
        <div className="topic">{n.topic}</div>
        <div className="headline">{n.title}</div>
        <div className="small muted">
          {n.sourceName ? `${n.sourceName} · ` : ""}
          {timeAgo(n.publishedAt)}
        </div>
        {external ? (
          <div className="ext">
            Read on {n.sourceName ?? "the publisher’s site"} <span aria-hidden="true">↗</span>
            <span className="sr"> (opens in a new tab)</span>
          </div>
        ) : null}
      </div>
    </a>
  );
}
