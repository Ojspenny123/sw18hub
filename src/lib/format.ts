const TZ = "Europe/London";

export function dayShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", timeZone: TZ });
}
export function dayNum(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", timeZone: TZ });
}
export function timeShort(iso: string) {
  if (!iso.includes("T")) return "";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}
export function dateLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
}
export function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return dateLong(iso);
}

/** "9am", "6.30pm": short clock time in London. Empty for all-day dates. */
export function clock(iso: string) {
  if (!iso.includes("T")) return "";
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hourCycle: "h23", timeZone: TZ }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  const h = Number(p.hour);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${p.minute === "00" ? "" : `.${p.minute}`}${h < 12 ? "am" : "pm"}`;
}
/** "Sat 21 Nov" */
export function dayMonth(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-GB", { weekday: "short", timeZone: TZ });
  const num = d.toLocaleDateString("en-GB", { day: "numeric", timeZone: TZ });
  const mon = d.toLocaleDateString("en-GB", { month: "short", timeZone: TZ });
  return `${day} ${num} ${mon}`;
}
