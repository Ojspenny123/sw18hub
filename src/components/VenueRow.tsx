import Link from "next/link";
import type { VenueWithRating } from "@/lib/types";
import { venueImage } from "@/lib/images";

/** One venue in a list. The whole row is a link to the venue page. */
export default function VenueRow({ v, rank, selected }: { v: VenueWithRating; rank?: number; selected?: boolean }) {
  const g = v.google;
  const img = venueImage(v, 200);
  const credit = v.image ? v.imageCredit : v.photo?.credit;
  return (
    <Link href={`/places/${v.slug}`} className="venue" aria-current={selected || undefined}>
      <div className="thumb" style={img ? { backgroundImage: `url(${img})` } : undefined} role="img" aria-label={img ? `Photo of ${v.name}${credit ? `. ${credit}` : ""}` : undefined} aria-hidden={img ? undefined : true} />
      <div className="body">
        <div className="top">
          <span className="name">
            {rank ? `${rank}. ` : ""}
            {v.name}
          </span>
          {g?.rating ? <span className="rating">★ {g.rating.toFixed(1)}</span> : null}
        </div>
        <div className="small muted">
          {v.type} · {v.area}
          {g?.count ? ` · ${g.count.toLocaleString("en-GB")} reviews` : ""}
        </div>
        {g?.openNow !== undefined ? (
          <div className={`small ${g.openNow ? "status-open" : "status-closed"}`}>{g.openNow ? "Open now" : "Closed now"}</div>
        ) : null}
        {v.features.length ? (
          <div className="tags">
            {v.features.slice(0, 3).map((f) => (
              <span key={f} className="tag">{f}</span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
