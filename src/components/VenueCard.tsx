import Link from "next/link";
import type { VenueWithRating } from "@/lib/types";

export default function VenueCard({ v }: { v: VenueWithRating }) {
  const g = v.google;
  return (
    <Link href="/places" className="card">
      <div className="card-img" style={v.image ? { backgroundImage: `url(${v.image}?w=600&fm=webp)` } : undefined} />
      <div className="card-body">
        <div className="card-title">{v.name}</div>
        <div className="small muted">
          {v.type} · {v.area}
        </div>
        {g?.rating ? (
          <div className="small">
            <span className="rating">★ {g.rating.toFixed(1)}</span>
            <span className="muted"> · {g.count?.toLocaleString("en-GB")} reviews</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
