"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="header">
      <div className="wrap">
        <Link href="/" className="logo" aria-label="SW18 Hub home" onClick={close}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="SW18 Hub" width={105} height={36} />
        </Link>
        <button type="button" className="menu-btn" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "Menu"}
        </button>
        <div id="main-nav" className={`nav-wrap${open ? " open" : ""}`}>
          <nav className="nav" aria-label="Main">
            <Link href="/whats-on" onClick={close}>What&apos;s on</Link>
            <Link href="/places" onClick={close}>Places</Link>
            <Link href="/news" onClick={close}>News</Link>
          </nav>
          <Link href="/ask" className="btn" onClick={close}>
            Ask SW18
          </Link>
        </div>
      </div>
    </header>
  );
}
