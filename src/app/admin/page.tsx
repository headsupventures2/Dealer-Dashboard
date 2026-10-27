"use client";

import Link from "next/link";
import { useCompanies } from "@/components/companies";
import { ButtonLink, Card, PageTitle } from "@/components/ui";
import { money } from "@/lib/format";

export default function AdminOverview() {
  const { companies, loading } = useCompanies();

  return (
    <>
      <PageTitle
        title="Overview"
        subtitle="All dealership and fleet partners"
        action={<ButtonLink href="/admin/companies/new">+ Add company</ButtonLink>}
      />

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
        <Card className="p-0 sm:p-0">
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
                  <div className="text-right text-sm">
                    <p className="font-semibold">{money(c.price_per_vehicle)}</p>
                    <p className="text-navy/55">per detail</p>
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
