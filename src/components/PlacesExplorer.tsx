"use client";

import { useMemo, useState } from "react";
import { AdvancedMarker, APIProvider, Map } from "@vis.gl/react-google-maps";
import { AREAS, FEATURES, VENUE_TYPES, type VenueWithRating } from "@/lib/types";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID";
const CENTER = { lat: 51.455, lng: -0.19 };

type Sort = "rating" | "reviews" | "name";

export default function PlacesExplorer({ venues }: { venues: VenueWithRating[] }) {
  const [type, setType] = useState("All");
  const [area, setArea] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [highRated, setHighRated] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [sort, setSort] = useState<Sort>("rating");
  const [selected, setSelected] = useState<string | null>(null);

  const list = useMemo(() => {
    const out = venues.filter(
      (v) =>
        (type === "All" || v.type === type) &&
        (!area || v.area === area) &&
        features.every((f) => v.features.includes(f)) &&
        (!highRated || (v.google?.rating ?? 0) >= 4) &&
        (!openNow || v.google?.openNow === true),
    );
    out.sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "reviews"
          ? (b.google?.count ?? 0) - (a.google?.count ?? 0)
          : (b.google?.rating ?? 0) - (a.google?.rating ?? 0) || (b.google?.count ?? 0) - (a.google?.count ?? 0),
    );
    return out;
  }, [venues, type, area, features, highRated, openNow, sort]);

  const toggleFeature = (f: string) =>
    setFeatures((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  return (
    <>
      <div className="filters">
        <div className="filter-row">
          <span className="lbl" style={{ fontSize: 14, fontWeight: 600, marginRight: 4 }}>Type</span>
          {["All", ...VENUE_TYPES].map((t) => (
            <button key={t} type="button" className="chip" aria-pressed={type === t} onClick={() => setType(t)}>
              {t === "Cafe" ? "Cafes" : t === "All" ? "All" : `${t}s`}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <label className="lbl" htmlFor="area">Area</label>
          <select id="area" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">All areas</option>
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <button type="button" className="chip" aria-pressed={highRated} onClick={() => setHighRated((x) => !x)}>
            Rating 4.0+
          </button>
          <button type="button" className="chip" aria-pressed={openNow} onClick={() => setOpenNow((x) => !x)}>
            Open now
          </button>
          {FEATURES.map((f) => (
            <button key={f} type="button" className="chip" aria-pressed={features.includes(f)} onClick={() => toggleFeature(f)}>
              {f}
            </button>
          ))}
          <span style={{ flex: "1 1 auto" }} />
          <label className="lbl" htmlFor="sort">Sort</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="rating">Top rated</option>
            <option value="reviews">Most reviewed</option>
            <option value="name">A to Z</option>
          </select>
        </div>
      </div>
      <p className="small muted" aria-live="polite">
        {list.length} {list.length === 1 ? "place" : "places"} in SW18
      </p>

      <div className="split">
        <div className="venue-list">
          {list.length === 0 ? <div className="empty">No places match those filters.</div> : null}
          {list.map((v, i) => (
            <button
              key={v.id}
              type="button"
              className="venue"
              aria-current={selected === v.id}
              onClick={() => setSelected(v.id)}
            >
              <div className="thumb" style={v.image ? { backgroundImage: `url(${v.image}?w=200&fm=webp)` } : undefined} />
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 17 }}>
                    {i + 1}. {v.name}
                  </span>
                  {v.google?.rating ? <span className="rating">★ {v.google.rating.toFixed(1)}</span> : null}
                </div>
                <div className="small muted">
                  {v.type} · {v.area}
                  {v.google?.count ? ` · ${v.google.count.toLocaleString("en-GB")} reviews` : ""}
                </div>
                {v.google?.openNow !== undefined ? (
                  <div className="small muted">{v.google.openNow ? "Open now" : "Closed now"}</div>
                ) : null}
                {v.features.length ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {v.features.map((f) => (
                      <span key={f} className="tag">{f}</span>
                    ))}
                  </div>
                ) : null}
                {selected === v.id ? (
                  <div style={{ display: "flex", gap: 14, marginTop: 6 }} className="small">
                    {v.google?.mapsUri ? (
                      <a href={v.google.mapsUri} target="_blank" rel="noopener noreferrer">View on Google Maps</a>
                    ) : null}
                    {v.website ? (
                      <a href={v.website} target="_blank" rel="noopener noreferrer">Website</a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </button>
          ))}
        </div>

        {MAPS_KEY ? (
          <div className="map" style={{ padding: 0 }}>
            <APIProvider apiKey={MAPS_KEY}>
              <Map
                defaultCenter={CENTER}
                defaultZoom={14}
                mapId={MAP_ID}
                gestureHandling="greedy"
                style={{ width: "100%", height: "100%" }}
              >
                {list.map((v, i) =>
                  v.lat !== undefined && v.lon !== undefined ? (
                    <AdvancedMarker
                      key={v.id}
                      position={{ lat: v.lat, lng: v.lon }}
                      title={v.name}
                      onClick={() => setSelected(v.id)}
                    >
                      <div className={selected === v.id ? "pin on" : "pin"}>{i + 1}</div>
                    </AdvancedMarker>
                  ) : null,
                )}
              </Map>
            </APIProvider>
          </div>
        ) : (
          <div className="map">
            <p className="muted">The map appears here once a Google Maps API key is added (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).</p>
          </div>
        )}
      </div>
    </>
  );
}
