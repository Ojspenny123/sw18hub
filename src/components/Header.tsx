"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS: [string, string][] = [
  ["What's on", "/whats-on"],
  ["Run clubs", "/run-clubs"],
  ["Places", "/places"],
  ["News", "/news"],
];

const today = () => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long" }).format(new Date());

export default function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const home = path === "/";
  const close = () => setOpen(false);
  return (
    <>
      {home ? (
        <div className="strip">
          <div className="wrap">
            <time suppressHydrationWarning>{today()}</time>
            <span>Wandsworth Town, Earlsfield, Southfields, Wandsworth Common</span>
          </div>
        </div>
      ) : null}
      <div className={`masthead${home ? " big" : ""}`}>
        <div className="wrap">
          <Link href="/" className="mast-title" aria-label="SW18 Hub home" onClick={close}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="SW18 Hub" width={364} height={124} />
          </Link>
          {home ? <p className="mast-tag">The local noticeboard for south-west London</p> : null}
        </div>
      </div>
      <header className="navbar">
        <div className="wrap">
          <button type="button" className="menu-btn" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen((o) => !o)}>
            {open ? "Close" : "Menu"}
          </button>
          <nav id="main-nav" className={`nav${open ? " open" : ""}`} aria-label="Main">
            {LINKS.map(([label, href]) => (
              <Link key={href} href={href} onClick={close} aria-current={path === href || path.startsWith(`${href}/`) ? "page" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
          <Link href="/ask" className="ask-pill" onClick={close}>
            Ask SW18
          </Link>
        </div>
      </header>
    </>
  );
}
