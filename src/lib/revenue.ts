import type { Job } from "./types";

export interface RevenueSummary {
  jobs: number;
  revenue: number; // service revenue only (locked price at completion)
  profit: number; // revenue minus cost, for jobs that have a cost set
  jobsWithCost: number;
  fuelBilled: number; // fuel passed through to the dealer, kept out of revenue and profit
}

/** "2026-10" for a completed_at timestamp, in local time. */
export function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export const thisMonth = () => monthKey(new Date().toISOString());

/** Completed jobs, optionally limited to one month ("all" for all time). */
export function completedIn(jobs: Job[], month: string = "all") {
  return jobs.filter((j) => j.status === "completed" && j.completed_at && (month === "all" || monthKey(j.completed_at) === month));
}

export function summarize(jobs: Job[]): RevenueSummary {
  const s: RevenueSummary = { jobs: 0, revenue: 0, profit: 0, jobsWithCost: 0, fuelBilled: 0 };
  for (const j of jobs) {
    s.jobs += 1;
    s.revenue += j.price_at_completion ?? 0;
    s.fuelBilled += j.fuel_amount ?? 0;
    if (j.cost_at_completion != null) {
      s.profit += (j.price_at_completion ?? 0) - j.cost_at_completion;
      s.jobsWithCost += 1;
    }
  }
  return s;
}

/** Months that have completed work, newest first, always including the current month. */
export function monthsWithWork(jobs: Job[]) {
  const keys = new Set(completedIn(jobs).map((j) => monthKey(j.completed_at!)));
  keys.add(thisMonth());
  return [...keys].sort().reverse();
}
