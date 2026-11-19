import { RUN_CLUBS } from "@/lib/recurring";
import ImageCredit from "./ImageCredit";

export default function RunClubs() {
  return (
    <section aria-label="Run clubs">
      <p className="muted" style={{ marginBottom: 16 }}>
        Regular run clubs in and around SW18. Times can change, so check the club&apos;s page before you go.
      </p>
      <div className="ncards ncards-grid">
        {RUN_CLUBS.map((c) => (
          <div key={c.id} className="ncard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ncard-img" src={c.photo.image} alt="" loading="lazy" />
            <span className="ncard-body">
              <span className="ncard-day">{c.when}</span>
              <a href={c.link} className="ncard-title ncard-link" target="_blank" rel="noopener noreferrer">
                {c.name}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <span className="ncard-meta">{[c.place, c.area && `${c.area} (nearby)`].filter(Boolean).join(" · ")}</span>
              <span className="small">{c.description}</span>
              <ImageCredit e={c.photo} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
