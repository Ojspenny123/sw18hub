"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Map = dynamic(() => import("./VenueMapSingle"), { ssr: false });

/** Loads the map code and tiles only when the box scrolls into view. */
export default function VenueLocation({ lat, lon, name }: { lat: number; lon: number; name: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={box} className="venue-map" role="img" aria-label={`Map showing where ${name} is`}>
      {show ? <Map lat={lat} lon={lon} name={name} /> : null}
    </div>
  );
}
