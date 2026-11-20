"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";

const icon = L.divIcon({ className: "", html: '<div class="pin on"></div>', iconSize: [32, 32], iconAnchor: [16, 16] });

/** One pin, no zoom or drag, so the page still scrolls normally on a phone. Free OpenStreetMap tiles. */
export default function VenueMapSingle({ lat, lon, name }: { lat: number; lon: number; name: string }) {
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={16}
      scrollWheelZoom={false}
      dragging={false}
      touchZoom={false}
      doubleClickZoom={false}
      boxZoom={false}
      keyboard={false}
      zoomControl={false}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
      <Marker position={[lat, lon]} icon={icon} title={name} keyboard={false} />
    </MapContainer>
  );
}
