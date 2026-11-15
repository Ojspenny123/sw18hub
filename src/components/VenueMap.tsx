"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

/**
 * Free map: Leaflet + OpenStreetMap tiles. No API key, no charges.
 * Venue positions come from data/venue-osm.json (OpenStreetMap), not from a live service.
 */
export interface MapPoint {
  id: string;
  n: number;
  name: string;
  lat?: number;
  lon?: number;
}

const CENTER: [number, number] = [51.455, -0.19];

const icon = (n: number, on: boolean) =>
  L.divIcon({
    className: "",
    html: `<div class="${on ? "pin on" : "pin"}">${n}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

function Fit({ pts }: { pts: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (pts.length > 1) map.fitBounds(pts, { padding: [30, 30], maxZoom: 16 });
    else if (pts.length === 1) map.setView(pts[0], 16);
  }, [map, pts]);
  return null;
}

export default function VenueMap({ points, selected, onSelect }: { points: MapPoint[]; selected: string | null; onSelect: (id: string | null) => void }) {
  const placed = points.filter((p) => p.lat !== undefined && p.lon !== undefined);
  const key = placed.map((p) => p.id).join(",");
  return (
    <div className="gm">
      <MapContainer center={CENTER} zoom={14} scrollWheelZoom style={{ width: "100%", height: "100%" }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <Fit key={key} pts={placed.map((p) => [p.lat as number, p.lon as number])} />
        {placed.map((p) => (
          <Marker key={p.id} position={[p.lat as number, p.lon as number]} icon={icon(p.n, selected === p.id)} title={p.name} eventHandlers={{ click: () => onSelect(p.id) }} />
        ))}
      </MapContainer>
    </div>
  );
}
