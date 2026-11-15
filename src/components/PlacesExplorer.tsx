"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdvancedMarker, APIProvider, Map } from "@vis.gl/react-google-maps";
import VenueRow from "@/components/VenueRow";
import { venueImage } from "@/lib/images";
import { AREAS, FEATURES, VENUE_TYPES, type VenueWithRating } from "@/lib/types";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID";
const CENTER = { lat: 51.455, lng: -0.19 };

type Sort = "rating" | "reviews" | "name";

export default function PlacesExplorer({ venues }: { venues: VenueWithRating[] }) {
  const [view, setView] = useState<"list" | "map">("list");
  const [showFilters, setShowFilters] = useState(false);
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

  const toggleFeature = (f: string) => setFeatures((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  const activeCount = (area ? 1 : 0) + (highRated ? 1 : 0) + (openNow ? 1 : 0) + features.length;
  const clearAll = () => {
    setArea("");
    setHighRated(false);
    setOpenNow(false);
    setFeatures([]);
  };
  const sel = list.find((v) => v.id === selected);
  const selImg = sel ? venueImage(sel, 160) : undefined;

  return (
    <>
      <div className="chips" role="group" aria-label="Type of place">
        {["All", ...VENUE_TYPES].map((t) => (
          <button key={t} type="button" className="chip" aria-pressed={type === t} onClick={() => setType(t)}>
            {t === "Cafe" ? "Cafes" : t === "All" ? "All" : `${t}s`}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <p className="count" aria-live="polite">
          {list.length} {list.length === 1 ? "place" : "places"}
        </p>
        <button type="button" className="chip" aria-expanded={showFilters} aria-controls="filter-panel" onClick={() => setShowFilters((s) => !s)}>
          Filters
          {activeCount ? <span className="badge">{activeCount}</span> : null}
        </button>
        <label className="sr" htmlFor="sort">Sort by</label>
        <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="rating">Top rated</option>
          <option value="reviews">Most reviewed</option>
          <option value="name">A to Z</option>
        </select>
      </div>

      {showFilters ? (
        <div className="filter-panel" id="filter-panel">
          <label className="sel">
            Area
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">All areas</option>
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <div className="wrapchips" role="group" aria-label="More filters">
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
          </div>
          {activeCount ? (
            <button type="button" className="clear" onClick={clearAll}>
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="split" data-view={view}>
        <div className="venue-list">
          {list.length === 0 ? <div className="empty">No places match those filters.</div> : null}
          {list.map((v, i) => (
            <VenueRow key={v.id} v={v} rank={i + 1} selected={selected === v.id} />
          ))}
        </div>

        <div className="map-panel">
          {MAPS_KEY ? (
            <div className="gm">
              <APIProvider apiKey={MAPS_KEY}>
                <Map
                  key={view}
                  defaultCenter={CENTER}
                  defaultZoom={14}
                  mapId={MAP_ID}
                  gestureHandling="greedy"
                  disableDefaultUI
                  zoomControl
                  onClick={() => setSelected(null)}
                  style={{ width: "100%", height: "100%" }}
                >
                  {list.map((v, i) => {
                    const lat = v.lat ?? v.google?.lat;
                    const lon = v.lon ?? v.google?.lon;
                    return lat !== undefined && lon !== undefined ? (
                      <AdvancedMarker key={v.id} position={{ lat, lng: lon }} title={v.name} onClick={() => setSelected(v.id)}>
                        <div className={selected === v.id ? "pin on" : "pin"}>{i + 1}</div>
                      </AdvancedMarker>
                    ) : null;
                  })}
                </Map>
              </APIProvider>
            </div>
          ) : (
            <p className="muted" style={{ padding: 24 }}>
              The map appears here once a Google Maps API key is added (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
            </p>
          )}
          {sel ? (
            <div className="map-card">
              <div className="thumb" style={selImg ? { backgroundImage: `url(${selImg})` } : undefined} aria-hidden="true" />
              <div className="body">
                <span style={{ fontWeight: 600 }}>{sel.name}</span>
                <span className="small muted">
                  {sel.google?.rating ? `★ ${sel.google.rating.toFixed(1)} · ` : ""}
                  {sel.type} · {sel.area}
                </span>
              </div>
              <Link href={`/places/${sel.slug}`} className="btn">
                Details
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <button type="button" className="view-fab" onClick={() => setView((v) => (v === "list" ? "map" : "list"))} aria-label={view === "list" ? "Show map" : "Show list"}>
        {view === "list" ? "Map" : "List"}
      </button>
    </>
  );
}
