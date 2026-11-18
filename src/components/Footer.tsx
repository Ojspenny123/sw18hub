import Link from "next/link";
import CookieSettings from "./CookieSettings";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <strong style={{ color: "var(--ink)" }}>SW18 Hub</strong>
          <span className="fine">A local guide to Wandsworth Town, Earlsfield, Southfields and Wandsworth Common. Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.</span>
        </div>
        <nav aria-label="Footer">
          <Link href="/about">About</Link>
          <Link href="/deals#business">Add your business</Link>
          <Link href="/privacy">Privacy and cookies</Link>
          <CookieSettings />
        </nav>
      </div>
    </footer>
  );
}
