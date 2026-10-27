"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useCompanies } from "@/components/companies";
import { CompanyForm } from "@/components/company-form";
import { RequestQueue } from "@/components/request-queue";
import { Button, Card, ErrorText, Field, PageTitle } from "@/components/ui";
import { money } from "@/lib/format";
import { store } from "@/lib/store";
import { SERVICES, type Profile } from "@/lib/types";

export default function CompanyPage() {
  const { id } = useParams<{ id: string }>();
  const { companies, loading, refresh } = useCompanies();
  const company = companies.find((c) => c.id === id);
  const [editing, setEditing] = useState(false);

  if (loading) return <p className="text-navy/60">Loading…</p>;
  if (!company) return <p className="text-navy/60">Company not found.</p>;

  if (editing) {
    return (
      <>
        <PageTitle
          title={`Edit ${company.name}`}
          action={
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          }
        />
        <CompanyForm
          initial={company}
          submitLabel="Save changes"
          onSubmit={async (input) => {
            await store.updateCompany(company.id, input);
            await refresh();
            setEditing(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageTitle
        title={company.name}
        subtitle={[company.contact_name, company.contact_phone, company.contact_email].filter(Boolean).join(" · ")}
        action={
          <Button variant="ghost" onClick={() => setEditing(true)}>
            Edit company
          </Button>
        }
      />

      <RequestQueue companyId={company.id} />

      <h2 className="mb-3 mt-10 text-lg font-bold">Deal rates</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {SERVICES.map((s) => {
          const price = company[s.priceKey] ?? 0;
          const cost = company[s.costKey];
          return (
            <Card key={s.type}>
              <p className="text-sm font-medium text-navy/60">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{money(price)}</p>
              <p className="mt-1 text-sm text-navy/55">
                per vehicle{cost != null && <> · profit {money(price - cost)}</>}
              </p>
            </Card>
          );
        })}
      </div>

      <ClientLogins companyId={company.id} />
    </>
  );
}

function ClientLogins({ companyId }: { companyId: string }) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => setUsers(await store.listCompanyUsers(companyId)), [companyId]);

  useEffect(() => {
    store.listCompanyUsers(companyId).then(setUsers);
  }, [companyId]);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters");
    setBusy(true);
    setError("");
    try {
      await store.createClientUser(companyId, email, password);
      setEmail("");
      setPassword("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create login");
    }
    setBusy(false);
  }

  return (
    <Card className="mt-6">
      <h2 className="text-lg font-semibold">Dealership logins</h2>
      <p className="mt-1 text-sm text-navy/60">These users see only this company&apos;s requests and history.</p>

      {users.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium">{u.email}</span>
              <span className="rounded-full bg-maroon/10 px-2.5 py-0.5 text-xs font-semibold text-maroon">Client</span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          label="Temporary password"
          type="text"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={busy}>
          {busy ? "Adding…" : "Add login"}
        </Button>
      </form>
      <p className="mt-2 text-xs text-navy/55">Password must be 8+ characters. Share it with them directly.</p>
      <div className="mt-3">
        <ErrorText>{error}</ErrorText>
      </div>
    </Card>
  );
}
