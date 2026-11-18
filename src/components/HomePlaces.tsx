"use client";

import { useState } from "react";
import VenueCard from "./VenueCard";
import { typePlural } from "@/lib/seo";
import type { VenueWithRating } from "@/lib/types";

/** Four places per category, chosen on the server. The tabs only switch which set is showing. */
export default function HomePlaces({ groups }: { groups: { type: string; venues: VenueWithRating[] }[] }) {
  const [tab, setTab] = useState("All");
  const tabs = groups.map((g) => g.type);
  const shown = groups.find((g) => g.type === tab)?.venues ?? groups.find((g) => g.type === "All")?.venues ?? [];
  const label = (t: string) => (t === "All" ? "All" : typePlural(t).replace(/^./, (c) => c.toUpperCase()));
  return (
    <>
      <div className="chips" role="group" aria-label="Type of place">
        {tabs.map((t) => (
          <button key={t} type="button" className={`chip${tab === t ? " on" : ""}`} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {label(t)}
          </button>
        ))}
      </div>
      <div className="snap">
        {shown.map((v) => (
          <VenueCard key={v.id} v={v} />
        ))}
      </div>
    </>
  );
}
