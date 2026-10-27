import type { Company } from "./types";

/** Business hours shown in week/day views (matches the Google Business listing). */
export const OPEN_HOUR = 7;
export const CLOSE_HOUR = 18;
export const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

/** Where a dropped or tapped request lands when only a day is picked (month view). */
export const DEFAULT_HOUR = 9;

// Brand navy/rust/maroon first, then supporting tones that sit well on cream.
const COLORS = ["#1F2F4F", "#B5452F", "#7A2A3A", "#2F6F6A", "#C08A2B", "#4A6FA5", "#5E3A6E", "#6B7A3A"];

/** Stable per-company color: assigned in the order companies were added. */
export function companyColors(companies: Company[]) {
  const ordered = [...companies].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return new Map(ordered.map((c, i) => [c.id, COLORS[i % COLORS.length]]));
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
}

export function startOfWeek(d: Date) {
  return addDays(startOfDay(d), -d.getDay()); // weeks start Sunday
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** The 6 weeks (42 days) shown for the month containing d. */
export function monthGrid(d: Date) {
  const first = startOfWeek(new Date(d.getFullYear(), d.getMonth(), 1));
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}

export function atHour(day: Date, hour: number, minute = 0) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
}

export function hourLabel(h: number) {
  return `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
}
