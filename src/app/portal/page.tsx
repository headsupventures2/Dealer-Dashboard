"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth";
import { JobHeading, StatusTag } from "@/components/jobs";
import { ButtonLink, Card } from "@/components/ui";
import { takeFlash } from "@/lib/flash";
import { dateTime, day, localDay, time } from "@/lib/format";
import { store } from "@/lib/store";
import type { Company, Job } from "@/lib/types";

export default function PortalHome() {
  const { profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // Re-runs each time this page is shown again, so new requests and updates appear right away.
  useEffect(() => {
    const companyId = profile?.company_id;
    if (!companyId) return;
    store.getCompany(companyId).then(setCompany);
    store.listJobs(companyId).then(setJobs);
    const m = takeFlash();
    if (m) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot message read on show
      setFlash(m);
    }
  }, [profile?.company_id]);

  const all = jobs ?? [];
  const open = all.filter((j) => j.status !== "completed");
  const completed = all.filter((j) => j.status === "completed");
  const detailsDone = completed.filter((j) => j.service_type === "detail").length;
  const rinsed = completed.filter((j) => j.service_type === "lot_rinse").reduce((n, j) => n + j.vehicle_count, 0);
  const fuels = completed.filter((j) => j.service_type === "fuel_fill").length;

  const today = localDay(new Date().toISOString());
  const scheduled = open
    .filter((j) => j.scheduled_at)
    .sort((a, b) => a.scheduled_at!.localeCompare(b.scheduled_at!));
  const next = scheduled.find((j) => localDay(j.scheduled_at!) >= today);
  const unscheduled = open.filter((j) => !j.scheduled_at);
  const recent = [...completed].sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")).slice(0, 5);

  // "Our Plan With You": scheduled work grouped by day.
  const byDay = new Map<string, Job[]>();
  for (const j of scheduled) {
    const k = localDay(j.scheduled_at!);
    byDay.set(k, [...(byDay.get(k) ?? []), j]);
  }

  const extras = [rinsed && `${rinsed} vehicles rinsed`, fuels && `${fuels} fuel fill-up${fuels === 1 ? "" : "s"}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <p className="font-brand text-xs font-semibold uppercase tracking-[0.22em] text-rust">Partner portal</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{company?.name ?? "…"}</h1>

      {flash && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-xl bg-navy px-5 py-4 text-white">
          <span className="font-semibold">{flash}</span>
          <button onClick={() => setFlash(null)} className="text-sm text-white/70 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Details completed" value={jobs ? String(detailsDone) : "…"} sub={extras || undefined} />
        <Stat label="Open requests" value={jobs ? String(open.length) : "…"} sub={unscheduled.length ? `${unscheduled.length} awaiting a date` : undefined} />
        <Stat
          label="Next scheduled visit"
          value={jobs ? (next ? day(localDay(next.scheduled_at!)) : "—") : "…"}
          sub={next ? time(next.scheduled_at!) : jobs ? "Nothing scheduled yet" : undefined}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <ButtonLink href="/portal/request/detail" className="min-h-16 text-lg">
          Request a Detail
        </ButtonLink>
        <ButtonLink href="/portal/request/lot_rinse" variant="secondary" className="min-h-16">
          Request Lot Rinse
        </ButtonLink>
        <ButtonLink href="/portal/request/fuel_fill" variant="secondary" className="min-h-16">
          Request Fuel Fill-Up
        </ButtonLink>
      </div>

      <h2 className="mb-3 mt-10 text-lg font-bold">Our plan with you</h2>
      {jobs === null ? (
        <p className="text-navy/60">Loading…</p>
      ) : open.length === 0 ? (
        <Card className="py-10 text-center text-navy/60">No open requests. Tap a button above to send one.</Card>
      ) : (
        <Card flush>
          {[...byDay].map(([d, list]) => (
            <div key={d} className="border-b border-line last:border-0">
              <p className="bg-cream/60 px-5 py-2 font-brand text-sm font-bold sm:px-6">
                {d === today ? "Today" : day(d)}
              </p>
              <ul className="divide-y divide-line">
                {list.map((j) => (
                  <PlanRow key={j.id} job={j} when={time(j.scheduled_at!)} />
                ))}
              </ul>
            </div>
          ))}
          {unscheduled.length > 0 && (
            <div>
              <p className="bg-cream/60 px-5 py-2 font-brand text-sm font-bold sm:px-6">Awaiting scheduling</p>
              <ul className="divide-y divide-line">
                {unscheduled.map((j) => (
                  <PlanRow key={j.id} job={j} when={j.preferred_date ? `Preferred ${day(j.preferred_date)}` : "We'll confirm a date"} />
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <div className="mb-3 mt-10 flex items-end justify-between">
        <h2 className="text-lg font-bold">Recently completed</h2>
        {completed.length > 0 && (
          <Link href="/portal/history" className="text-sm font-semibold text-rust hover:underline">
            Full vehicle history →
          </Link>
        )}
      </div>
      {jobs !== null &&
        (recent.length === 0 ? (
          <Card className="py-10 text-center text-navy/60">Completed vehicles with before and after photos will show here.</Card>
        ) : (
          <Card flush>
            <ul className="divide-y divide-line">
              {recent.map((j) => (
                <PlanRow key={j.id} job={j} when={dateTime(j.completed_at)} />
              ))}
            </ul>
          </Card>
        ))}
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <p className="text-sm font-medium text-navy/60">{label}</p>
      <p className="mt-1 font-brand text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-sm text-navy/55">{sub}</p>}
    </Card>
  );
}

function PlanRow({ job, when }: { job: Job; when: string }) {
  return (
    <li>
      <Link
        href={`/portal/jobs/${job.id}`}
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-cream/40 sm:px-6"
      >
        <JobHeading job={job} />
        <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
          <StatusTag status={job.status} />
          <span className="text-navy/70">{when}</span>
        </div>
      </Link>
    </li>
  );
}
