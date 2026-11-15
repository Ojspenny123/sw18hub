import Link from "next/link";

export default function Header() {
  return (
    <header className="header">
      <div className="wrap">
        <Link href="/" className="logo" aria-label="SW18 Hub home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="SW18 Hub" height={40} style={{ height: 40, width: "auto", display: "block" }} />
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/places">Places</Link>
          <Link href="/news">News</Link>
          <Link href="/news#whats-on">What&apos;s on</Link>
          <Link href="/deals">Deals</Link>
        </nav>
        <Link href="/ask" className="btn">
          Ask SW18
        </Link>
      </div>
    </header>
  );
}
