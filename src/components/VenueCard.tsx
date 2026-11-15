import Link from "next/link";
import type { VenueWithRating } from "@/lib/types";
import { venueImage } from "@/lib/images";

export default function VenueCard({ v }: { v: VenueWithRating }) {
  const g = v.google;
  const img = venueImage(v, 600);
  return (
    <Link href={`/places/${v.slug}`} className="card">
      <div className="card-img" style={img ? { backgroundImage: `url(${img})` } : undefined} role="img" aria-label={`Photo of ${v.name}`} />
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
        {!v.image && v.photo ? <div className="credit">Photo: {v.photo.author}, {v.photo.license}, via Wikimedia Commons</div> : null}
      </div>
    </Link>
  );
}
