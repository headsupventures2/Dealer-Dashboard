const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function money(n: number | null | undefined) {
  return n == null ? "—" : usd.format(n);
}

/** "Tue, Nov 4" from a YYYY-MM-DD date (no timezone shift). */
export function day(ymd: string | null | undefined) {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "Tue, Nov 4 · 9:30 AM" from an ISO timestamp, in local time. */
export function dateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

/** ISO timestamp → value for <input type="datetime-local">. */
export function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
