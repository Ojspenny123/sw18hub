// One-off, free: downloads candidate New Acres photos so they can be looked at before one is chosen for the popup.
import { mkdirSync, writeFileSync } from "node:fs";
const base = "https://www.newacreswandsworth.com/images/New-Acres/";
const files = ["home/eat-drink-do-1026x922.webp", "home/events-things-to-do-1026x922.webp"];
mkdirSync("data/probe-img", { recursive: true });
for (const f of files) {
  try {
    const res = await fetch(base + f, { headers: { "user-agent": "Mozilla/5.0 (compatible; SW18Hub/1.0)" } });
    writeFileSync("data/probe-img/" + f.split("/").pop(), Buffer.from(await res.arrayBuffer()));
  } catch (e) {
    console.log(f, String(e));
  }
}
