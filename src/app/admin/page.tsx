"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCompanies } from "@/components/companies";
import { FuelLine, MoneyTile, profitSub } from "@/components/revenue";
import { ButtonLink, Card, PageTitle } from "@/components/ui";
import { money } from "@/lib/format";
import { completedIn, monthLabel, monthsWithWork, summarize, thisMonth } from "@/lib/revenue";
import { store } from "@/lib/store";
import type { Job } from "@/lib/types";

export default function AdminOverview() {
  const { companies, loading } = useCompanies();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [month, setMonth] = useState(thisMonth);

  // Re-runs whenever the overview is shown again, so completed jobs count right away.
  useEffect(() => {
    store.listJobs().then(setJobs);
  }, []);

  const open = jobs.filter((j) => j.status !== "completed");
  const done = completedIn(jobs, month);
  const total = summarize(done);
  const period = month === "all" ? "all time" : monthLabel(month);

  return (
    <>
      <PageTitle
        title="Overview"
        subtitle="All dealership and fleet partners"
        action={<ButtonLink href="/admin/companies/new">+ Add company</ButtonLink>}
      />

      {!loading && companies.length === 0 ? (
        <Card className="py-12 text-center">
          <h2 className="text-lg font-semibold">Add your first partner</h2>
          <p className="mx-auto mt-1 max-w-sm text-navy/60">
            Set up a dealership with its per-vehicle rates, then give their service manager a login.
          </p>
          <ButtonLink href="/admin/companies/new" className="mt-6">
            + Add company
          </ButtonLink>
        </Card>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
            <Count label="New requests" value={open.filter((j) => j.status === "new").length} highlight />
            <Count label="Open requests" value={open.length} />
            <Count label="Partners" value={companies.length} />
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Revenue</h2>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              aria-label="Revenue period"
              className="min-h-11 rounded-lg border border-navy/15 bg-white px-3 text-base font-semibold outline-none focus:border-rust"
            >
              {monthsWithWork(jobs).map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
              <option value="all">All time</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <MoneyTile label="Revenue" value={money(total.revenue)} sub={period} accent className="col-span-2 sm:col-span-1" />
            <MoneyTile label="Profit" value={total.jobsWithCost ? money(total.profit) : "—"} sub={profitSub(total)} />
            <MoneyTile label="Jobs completed" value={String(total.jobs)} sub={period} />
          </div>
          <FuelLine s={total} />

          <h2 className="mb-3 mt-10 text-lg font-bold">Partners</h2>
          <Card flush>
            <div className="hidden grid-cols-[1fr_5rem_5rem_7rem_7rem] gap-4 border-b border-line bg-cream/60 px-6 py-2 text-xs font-semibold uppercase tracking-wider text-navy/55 sm:grid">
              <span>Company</span>
              <span className="text-right">Open</span>
              <span className="text-right">Jobs</span>
              <span className="text-right">Revenue</span>
              <span className="text-right">Profit</span>
            </div>
            <ul className="divide-y divide-line">
              {companies.map((c) => {
                const mine = open.filter((j) => j.company_id === c.id);
                const fresh = mine.filter((j) => j.status === "new").length;
                const s = summarize(done.filter((j) => j.company_id === c.id));
                return (
                  <li key={c.id}>
                    <Link
                      href={`/admin/companies/${c.id}`}
                      className="grid grid-cols-3 items-center gap-x-4 gap-y-2 px-5 py-4 hover:bg-cream/50 sm:grid-cols-[1fr_5rem_5rem_7rem_7rem] sm:px-6"
                    >
                      <div className="col-span-3 sm:col-span-1">
                        <p className="font-semibold">
                          {c.name}
                          {fresh > 0 && (
                            <span className="ml-2 rounded-full bg-rust px-1.5 py-0.5 text-xs text-white">{fresh} new</span>
                          )}
                        </p>
                        <p className="text-sm text-navy/55">{c.contact_name || c.contact_email || "No contact yet"}</p>
                      </div>
                      <Cell label="Open" value={String(mine.length)} />
                      <Cell label="Jobs" value={String(s.jobs)} />
                      <Cell label="Revenue" value={money(s.revenue)} strong />
                      <Cell label="Profit" value={s.jobsWithCost ? money(s.profit) : "—"} className="hidden sm:block" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
    </>
  );
}

function Count({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Card className={highlight && value > 0 ? "border-rust/40" : ""}>
      <p className="text-xs font-medium text-navy/60 sm:text-sm">{label}</p>
      <p className={`mt-1 font-brand text-2xl font-bold sm:text-3xl ${highlight && value > 0 ? "text-rust" : ""}`}>{value}</p>
    </Card>
  );
}

function Cell({ label, value, strong = false, className = "" }: { label: string; value: string; strong?: boolean; className?: string }) {
  return (
    <div className={`text-sm sm:text-right ${className}`}>
      <p className="text-xs text-navy/50 sm:hidden">{label}</p>
      <p className={strong ? "font-semibold" : ""}>{value}</p>
    </div>
  );
}
