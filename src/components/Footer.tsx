import Link from "next/link";
import CookieSettings from "./CookieSettings";
import Rich from "./Rich";
import type { SiteSettings } from "@/lib/pages";

export default function Footer({ s }: { s: SiteSettings }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <strong>{s.siteName}</strong>
          {s.footerText ? <Rich text={s.footerText} className="fine" /> : null}
        </div>
        <nav aria-label="Footer">
          {s.footerLinks.map((l) => (
            <Link key={l.href + l.label} href={l.href}>
              {l.label}
            </Link>
          ))}
          <CookieSettings />
        </nav>
      </div>
    </footer>
  );
}
