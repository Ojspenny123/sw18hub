"use client";

import { byScore } from "@/lib/rank";
import Link from "next/link";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import VenueRow from "@/components/VenueRow";
import { venueImage } from "@/lib/images";
import { AREAS, FEATURES, VENUE_TYPES, type VenueWithRating } from "@/lib/types";

const VenueMap = dynamic(() => import("@/components/VenueMap"), { ssr: false, loading: () => <p className="muted" style={{ padding: 24 }}>Loading map…</p> });

type Sort = "name" | "rating";

export default function PlacesExplorer({ venues }: { venues: VenueWithRating[] }) {
  const [view, setView] = useState<"list" | "map">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [type, setType] = useState("All");
  const [area, setArea] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
    const [sort, setSort] = useState<Sort>("name");
  const [selected, setSelected] = useState<string | null>(null);

  const list = useMemo(() => {
    const out = venues.filter(
      (v) =>
        (type === "All" || v.type === type) &&
        (!area || v.area === area) &&
        features.every((f) => v.features.includes(f)) &&
        true,
    );
    out.sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : byScore(a, b) || a.name.localeCompare(b.name),
    );
    return out;
  }, [venues, type, area, features, sort]);

  const toggleFeature = (f: string) => setFeatures((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  const activeCount = (area ? 1 : 0) + features.length;
  const clearAll = () => {
    setArea("");
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
          {list.map((v) => (
            <VenueRow key={v.id} v={v} selected={selected === v.id} />
          ))}
        </div>

        <div className="map-panel">
          <VenueMap
            points={list.map((v, i) => ({ id: v.id, n: i + 1, name: v.name, lat: v.lat, lon: v.lon }))}
            selected={selected}
            onSelect={setSelected}
          />
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
