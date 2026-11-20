import Link from "next/link";
import type { VenueWithRating } from "@/lib/types";
import { venueImage } from "@/lib/images";

export default function VenueCard({ v }: { v: VenueWithRating }) {
  const g = v.google;
  const img = venueImage(v, 600);
  const credit = v.image ? v.imageCredit : v.photo?.credit;
  return (
    <Link href={`/places/${v.slug}`} className="card">
      <div className="card-img" style={img ? { backgroundImage: `url(${img})` } : undefined} role="img" aria-label={`Photo of ${v.name}${credit ? `. ${credit}` : ""}`} />
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
