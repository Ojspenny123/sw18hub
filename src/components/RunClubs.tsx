import { RUN_CLUBS } from "@/lib/recurring";

export default function RunClubs({ intro }: { intro?: string }) {
  return (
    <section aria-label="Run clubs">
      {intro ? (
        <p className="muted" style={{ marginBottom: 16 }}>
          {intro}
        </p>
      ) : null}
      <div className="rcards">
        {RUN_CLUBS.map((c) => (
          <div key={c.id} className="rcard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="rcard-img" src={c.photo.image} alt={c.photo.imageCredit ? `Photo: ${c.photo.imageCredit}${c.photo.imageLicence ? `, ${c.photo.imageLicence}` : ""}` : ""} loading="lazy" />
            <span className="rcard-body">
              <span className="rcard-when">{c.when}</span>
              <a href={c.link} className="rcard-title" target="_blank" rel="noopener noreferrer">
                {c.name}
                <span className="sr"> (opens in a new tab)</span>
              </a>
              <span className="small muted">{[c.place, c.area && `${c.area} (nearby)`].filter(Boolean).join(" · ")}</span>
              <span className="small">{c.description}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
