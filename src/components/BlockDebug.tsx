"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const KEY = "sw18-blocks";
const read = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

function clear() {
  document.querySelectorAll<HTMLElement>(".sw18-dbg").forEach((el) => {
    el.classList.remove("sw18-dbg");
    el.removeAttribute("data-sw18-label");
    if (el.dataset.sw18Pos) {
      el.style.position = "";
      delete el.dataset.sw18Pos;
    }
  });
}

function mark(el: Element, label: string, out: string[]) {
  if (!(el instanceof HTMLElement)) return;
  if (getComputedStyle(el).display === "contents") {
    Array.from(el.children).forEach((c) => mark(c, label, out));
    return;
  }
  el.classList.add("sw18-dbg");
  el.setAttribute("data-sw18-label", label);
  if (getComputedStyle(el).position === "static") {
    el.style.position = "relative";
    el.dataset.sw18Pos = "1";
  }
  out.push(label);
}

/** Labels every block, the page heading, the header and the footer. Returns the labels that were applied. */
function apply(on: boolean): string[] {
  clear();
  const out: string[] = [];
  if (!on) return out;
  document.querySelectorAll<HTMLElement>("[data-sw18-block]").forEach((el) => mark(el, el.dataset.sw18Block!, out));
  document.querySelectorAll<HTMLElement>("[data-sw18-marker]").forEach((m) => {
    const next = m.nextElementSibling;
    if (next && !next.hasAttribute("data-sw18-marker")) mark(next, m.dataset.sw18Marker!, out);
  });
  return out;
}

declare global {
  interface Window {
    sw18Blocks?: (on?: boolean) => string;
  }
}

/**
 * Console helper for editors. In DevTools run:
 *   sw18Blocks()        toggle block labels on or off
 *   sw18Blocks(true)    on
 *   sw18Blocks(false)   off
 * Or add ?blocks=1 to any address. The choice is remembered in this browser.
 */
export default function BlockDebug() {
  const path = usePathname();

  useEffect(() => {
    window.sw18Blocks = (on?: boolean) => {
      const next = typeof on === "boolean" ? on : !read();
      try {
        localStorage.setItem(KEY, next ? "1" : "0");
      } catch {}
      const labels = apply(next);
      if (next) console.table(labels.map((label) => ({ label })));
      return next ? `Block labels ON (${labels.length}). Run sw18Blocks() to turn off.` : "Block labels OFF.";
    };
    return () => {
      delete window.sw18Blocks;
    };
  }, []);

  // Re-apply after every page change, and honour ?blocks=1 / ?blocks=0.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("blocks");
    if (q === "1" || q === "0") {
      try {
        localStorage.setItem(KEY, q);
      } catch {}
    }
    if (read()) {
      const t = setTimeout(() => apply(true), 50);
      return () => clearTimeout(t);
    }
  }, [path]);

  return null;
}
