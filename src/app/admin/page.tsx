"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCompanies } from "@/components/companies";
import { ButtonLink, Card, PageTitle } from "@/components/ui";
import { money } from "@/lib/format";
import { store } from "@/lib/store";
import type { Job } from "@/lib/types";

export default function AdminOverview() {
  const { companies, loading } = useCompanies();
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    store.listJobs().then(setJobs);
  }, []);

  const open = jobs.filter((j) => j.status !== "completed");
  const openFor = (companyId: string) => open.filter((j) => j.company_id === companyId);

  return (
    <>
      <PageTitle
        title="Overview"
        subtitle="All dealership and fleet partners"
        action={<ButtonLink href="/admin/companies/new">+ Add company</ButtonLink>}
      />

      {companies.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="New requests" value={open.filter((j) => j.status === "new").length} highlight />
          <Stat label="Open requests" value={open.length} />
          <Stat label="Partners" value={companies.length} />
        </div>
      )}

      {loading ? (
        <p className="text-navy/60">Loading…</p>
      ) : companies.length === 0 ? (
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
        <Card flush>
          <ul className="divide-y divide-line">
            {companies.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/companies/${c.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-cream/50 sm:px-6"
                >
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-navy/55">{c.contact_name || c.contact_email || "No contact yet"}</p>
                  </div>
                  <div className="flex items-center gap-6 text-right text-sm">
                    <div>
                      <p className="font-semibold">
                        {openFor(c.id).length}
                        {openFor(c.id).some((j) => j.status === "new") && (
                          <span className="ml-1.5 rounded-full bg-rust px-1.5 py-0.5 text-xs text-white">
                            {openFor(c.id).filter((j) => j.status === "new").length} new
                          </span>
                        )}
                      </p>
                      <p className="text-navy/55">open</p>
                    </div>
                    <div>
                      <p className="font-semibold">{money(c.price_per_vehicle)}</p>
                      <p className="text-navy/55">per detail</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Card className={highlight && value > 0 ? "border-rust/40" : ""}>
      <p className="text-sm font-medium text-navy/60">{label}</p>
      <p className={`mt-1 font-brand text-3xl font-bold ${highlight && value > 0 ? "text-rust" : ""}`}>{value}</p>
    </Card>
  );
}
