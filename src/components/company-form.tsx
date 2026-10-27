"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, ErrorText, Field } from "@/components/ui";
import { money } from "@/lib/format";
import { SERVICES, type Company, type CompanyInput, type RateKey } from "@/lib/types";

const EMPTY: CompanyInput = {
  name: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  price_per_vehicle: 0,
  cost_per_vehicle: null,
  lot_rinse_price: 0,
  lot_rinse_cost: null,
  fuel_fill_price: 0,
  fuel_fill_cost: null,
};

type Draft = Record<keyof CompanyInput, string>;

function toDraft(c: CompanyInput): Draft {
  return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v == null ? "" : String(v)])) as Draft;
}

function num(s: string) {
  const n = Number(s.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function CompanyForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Company;
  submitLabel: string;
  onSubmit(input: CompanyInput): Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial ?? EMPTY));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof CompanyInput) => (e: { target: { value: string } }) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return setError("Company name is required");
    const optional = (k: RateKey) => (draft[k].trim() === "" ? null : num(draft[k]));
    setBusy(true);
    setError("");
    try {
      await onSubmit({
        name: draft.name.trim(),
        contact_name: draft.contact_name.trim() || null,
        contact_email: draft.contact_email.trim() || null,
        contact_phone: draft.contact_phone.trim() || null,
        price_per_vehicle: num(draft.price_per_vehicle),
        cost_per_vehicle: optional("cost_per_vehicle"),
        lot_rinse_price: num(draft.lot_rinse_price),
        lot_rinse_cost: optional("lot_rinse_cost"),
        fuel_fill_price: num(draft.fuel_fill_price),
        fuel_fill_cost: optional("fuel_fill_cost"),
      });
      // Next keeps the "Add company" page mounted, so start it fresh for the next one.
      if (!initial) setDraft(toDraft(EMPTY));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Company & contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" required value={draft.name} onChange={set("name")} className="sm:col-span-2" />
          <Field label="Contact name" value={draft.contact_name} onChange={set("contact_name")} />
          <Field label="Contact phone" type="tel" value={draft.contact_phone} onChange={set("contact_phone")} />
          <Field
            label="Contact email"
            type="email"
            value={draft.contact_email}
            onChange={set("contact_email")}
            className="sm:col-span-2"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Deal rates</h2>
        <p className="mb-4 mt-1 text-sm text-navy/60">
          What this company pays us per vehicle. Each completed job locks in the rate at that moment, so changing a
          rate later never rewrites past revenue.
        </p>
        <div className="divide-y divide-line">
          {SERVICES.map((s) => {
            const price = num(draft[s.priceKey]);
            const cost = draft[s.costKey].trim() === "" ? null : num(draft[s.costKey]);
            return (
              <div key={s.type} className="grid gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[7rem_1fr_1fr_8rem] sm:items-end">
                <div className="self-center font-medium sm:pb-3">{s.label}</div>
                <Field
                  label="Price per vehicle"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={draft[s.priceKey]}
                  onChange={set(s.priceKey)}
                />
                <Field
                  label="Our cost (optional)"
                  inputMode="decimal"
                  placeholder="—"
                  value={draft[s.costKey]}
                  onChange={set(s.costKey)}
                />
                <div className="text-sm sm:pb-3 sm:text-right">
                  <span className="text-navy/55">Profit </span>
                  <span className="font-semibold">{cost == null ? "—" : money(price - cost)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy} className="w-full sm:w-auto">
        {busy ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
