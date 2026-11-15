import Link from "next/link";

export default function Header() {
  return (
    <header className="header">
      <div className="wrap">
        <Link href="/" className="logo">
          <span className="logo-mark" aria-hidden="true" />
          SW18 Hub
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
