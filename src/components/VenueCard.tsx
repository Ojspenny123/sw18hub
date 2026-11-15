import Link from "next/link";
import type { VenueWithRating } from "@/lib/types";
import { venueImage } from "@/lib/images";

export default function VenueCard({ v }: { v: VenueWithRating }) {
  const g = v.google;
  const img = venueImage(v, 600);
  return (
    <Link href="/places" className="card">
      <div className="card-img" style={img ? { backgroundImage: `url(${img})` } : undefined} />
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
        {!v.image && g?.photoUrl && g.photoCredit ? <div className="small muted">Photo: {g.photoCredit} / Google</div> : null}
      </div>
    </Link>
  );
}
