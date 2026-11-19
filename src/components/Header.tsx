"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { SiteSettings } from "@/lib/pages";

const today = () => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long" }).format(new Date());

export default function Header({ s }: { s: SiteSettings }) {
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
            <span>{s.stripText}</span>
          </div>
        </div>
      ) : null}
      <div className={`masthead${home ? " big" : ""}`} data-sw18-block="Header: site name and tagline · Site settings">
        <div className="wrap">
          <Link href="/" className="mast-logo" aria-hidden="true" tabIndex={-1} onClick={close}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width={364} height={124} />
          </Link>
          <Link href="/" className="mast-title" aria-label={`${s.siteName} home`} onClick={close}>
            {s.siteName}
          </Link>
          {home ? <h1 className="mast-tag">{s.tagline}</h1> : null}
        </div>
      </div>
      <header className="navbar" data-sw18-block="Header: menu and Ask button · Site settings">
        <div className="wrap">
          <button type="button" className="menu-btn" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen((o) => !o)}>
            {open ? "Close" : "Menu"}
          </button>
          <nav id="main-nav" className={`nav${open ? " open" : ""}`} aria-label="Main">
            {s.navLinks.map(({ label, href }) => (
              <Link key={href} href={href} onClick={close} aria-current={href === "/" ? (home ? "page" : undefined) : path === href || path.startsWith(`${href}/`) ? "page" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
          <Link href={s.askUrl} className="ask-pill" onClick={close}>
            {s.askLabel}
          </Link>
        </div>
      </header>
    </>
  );
}
