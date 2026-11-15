import Link from "next/link";
import { AREAS } from "@/lib/types";
import { bestSlug } from "@/lib/seo";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <strong style={{ color: "var(--ink)" }}>SW18 Hub</strong>
          <span className="fine">A local guide to Wandsworth Town, Earlsfield, Southfields and Wandsworth Common. Ratings, photos and map data from Google, refreshed weekly.</span>
        </div>
        <nav aria-label="Best of SW18">
          <Link href={`/best/${bestSlug("Restaurant")}`}>Restaurants</Link>
          <Link href={`/best/${bestSlug("Cafe")}`}>Cafes</Link>
          <Link href={`/best/${bestSlug("Bar")}`}>Bars</Link>
          <Link href={`/best/${bestSlug("Takeaway")}`}>Takeaways</Link>
          {AREAS.slice(0, 3).map((a) => (
            <Link key={a} href={`/best/${bestSlug("Restaurant", a)}`}>Eat in {a}</Link>
          ))}
        </nav>
        <nav aria-label="Footer">
          <Link href="/about">How we rank places</Link>
          <Link href="/deals#business">Add your business</Link>
        </nav>
      </div>
    </footer>
  );
}
