"use client";

import { byScore } from "@/lib/rank";
import { useMemo, useState } from "react";
import VenueRow from "@/components/VenueRow";
import { AREAS, FEATURES, VENUE_TYPES, type VenueWithRating } from "@/lib/types";


type Sort = "name" | "rating";

export default function PlacesExplorer({ venues }: { venues: VenueWithRating[] }) {
    const [showFilters, setShowFilters] = useState(false);
  const [type, setType] = useState("All");
  const [area, setArea] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
    const [sort, setSort] = useState<Sort>("name");
  const [selected] = useState<string | null>(null);

  const list = useMemo(() => {
    const out = venues.filter(
      (v) =>
        (type === "All" || v.type === type) &&
        (!area || v.area === area) &&
        features.every((f) => v.features.includes(f)) &&
        true,
    );
    out.sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : byScore(a, b) || a.name.localeCompare(b.name),
    );
    return out;
  }, [venues, type, area, features, sort]);

  const toggleFeature = (f: string) => setFeatures((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  const activeCount = (area ? 1 : 0) + features.length;
  const clearAll = () => {
    setArea("");
    setFeatures([]);
  };

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

      <div className="split">
        <div className="venue-list">
          {list.length === 0 ? <div className="empty">No places match those filters.</div> : null}
          {list.map((v, i) => (
            <VenueRow key={v.id} v={v} rank={i + 1} selected={selected === v.id} />
          ))}
        </div>

      </div>
    </>
  );
}
