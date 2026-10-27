"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth";
import { JobHeading, JobWhen, StatusTag } from "@/components/jobs";
import { ButtonLink, Card } from "@/components/ui";
import { takeFlash } from "@/lib/flash";
import { store } from "@/lib/store";
import type { Company, Job } from "@/lib/types";

export default function PortalHome() {
  const { profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // Re-runs each time this page is shown again, so new requests appear right away.
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

  const open = (jobs ?? []).filter((j) => j.status !== "completed");

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

      <h2 className="mb-3 mt-10 text-lg font-bold">Open requests</h2>
      {jobs === null ? (
        <p className="text-navy/60">Loading…</p>
      ) : open.length === 0 ? (
        <Card className="py-10 text-center text-navy/60">No open requests. Tap a button above to send one.</Card>
      ) : (
        <Card flush>
          <ul className="divide-y divide-line">
            {open.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                <JobHeading job={j} />
                <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
                  <StatusTag status={j.status} />
                  <JobWhen job={j} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
