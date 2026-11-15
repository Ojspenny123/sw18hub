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
