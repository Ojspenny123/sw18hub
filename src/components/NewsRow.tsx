import NewsThumb from "./NewsThumb";
import { timeAgo } from "@/lib/format";
import type { NewsArticle } from "@/lib/types";

/** One headline with a small picture. Links out to the publisher. */
export default function NewsRow({ n }: { n: NewsArticle }) {
  const external = Boolean(n.sourceUrl);
  return (
    <a href={n.sourceUrl ?? "/news"} className="nrow" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      <NewsThumb n={n} className="nrow-img" width={200} />
      <div style={{ minWidth: 0 }}>
        <div className="headline">{n.title}</div>
        <div className="small muted">
          {n.sourceName ? `${n.sourceName} · ` : ""}
          {timeAgo(n.publishedAt)}
        </div>
        {n.imageUrl && n.imageCredit ? <div className="small muted">Image: {n.imageCredit}</div> : null}
      </div>
      <span className="nrow-go" aria-hidden="true">Read ↗</span>
      {external ? <span className="sr"> (opens in a new tab)</span> : null}
    </a>
  );
}
