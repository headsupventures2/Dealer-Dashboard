"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth";
import { JobHeading } from "@/components/jobs";
import { Card } from "@/components/ui";
import { dateTime } from "@/lib/format";
import { store } from "@/lib/store";
import { serviceLabel, type Job } from "@/lib/types";

export default function HistoryPage() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [query, setQuery] = useState("");
  const [newestFirst, setNewestFirst] = useState(true);

  useEffect(() => {
    if (profile?.company_id) store.listJobs(profile.company_id).then(setJobs);
  }, [profile?.company_id]);

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = (jobs ?? [])
    .filter((j) => j.status === "completed")
    .filter((j) => {
      const text = [
        serviceLabel(j.service_type),
        j.vehicle_year,
        j.vehicle_make,
        j.vehicle_model,
        j.vehicle_color,
        j.stock_or_vin,
        j.lot_area,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return terms.every((t) => text.includes(t));
    })
    .sort((a, b) => {
      const c = (a.completed_at ?? "").localeCompare(b.completed_at ?? "");
      return newestFirst ? -c : c;
    });

  return (
    <>
      <Link href="/portal" className="text-sm font-semibold text-navy/60 hover:text-navy">
        ← Home
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Vehicle history</h1>

      <div className="mb-4 flex gap-3">
        <input
          type="search"
          placeholder="Search make, model, color, stock # or VIN"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-12 min-w-0 flex-1 rounded-lg border border-navy/15 bg-white px-4 text-base outline-none placeholder:text-navy/40 focus:border-rust focus:ring-2 focus:ring-rust/20"
        />
        <button
          onClick={() => setNewestFirst((n) => !n)}
          className="min-h-12 shrink-0 rounded-lg border border-navy/15 bg-white px-4 text-sm font-semibold hover:bg-navy/5"
        >
          {newestFirst ? "Newest ↓" : "Oldest ↑"}
        </button>
      </div>

      {jobs === null ? (
        <p className="text-navy/60">Loading…</p>
      ) : shown.length === 0 ? (
        <Card className="py-10 text-center text-navy/60">
          {query ? "No vehicles match that search." : "No completed vehicles yet."}
        </Card>
      ) : (
        <Card flush>
          <ul className="divide-y divide-line">
            {shown.map((j) => (
              <li key={j.id}>
                <Link
                  href={`/portal/jobs/${j.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-cream/40 sm:px-6"
                >
                  <JobHeading job={j} />
                  <span className="text-sm text-navy/70">{dateTime(j.completed_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {jobs !== null && shown.length > 0 && (
        <p className="mt-3 text-sm text-navy/55">
          {shown.length} vehicle{shown.length === 1 ? "" : "s"}
        </p>
      )}
    </>
  );
}
