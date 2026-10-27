"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth";
import { Button, Card, ErrorText, Field, TextArea } from "@/components/ui";
import { setFlash } from "@/lib/flash";
import { store } from "@/lib/store";
import { DETAIL_CHECKLIST, SERVICES, serviceLabel, type ChecklistItem, type ServiceType } from "@/lib/types";

const EMPTY = {
  year: "",
  make: "",
  model: "",
  color: "",
  stock: "",
  count: "",
  area: "",
  notes: "",
  date: "",
  other: "",
};

export default function RequestPage() {
  const { type } = useParams<{ type: string }>();
  const service = SERVICES.find((s) => s.type === type)?.type;
  if (!service) return <p className="text-navy/60">Unknown request type.</p>;
  return <RequestForm service={service} />;
}

function RequestForm({ service }: { service: ServiceType }) {
  const { profile } = useAuth();
  const router = useRouter();
  const [f, setF] = useState(EMPTY);
  const [checked, setChecked] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isLot = service === "lot_rinse";
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const toggle = (key: string) => {
    setError("");
    setChecked((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const count = isLot ? Number.parseInt(f.count, 10) : 1;
    const checklist: ChecklistItem[] = DETAIL_CHECKLIST.filter((c) => checked.includes(c.key)).map((c) => ({
      ...c,
      done: false,
    }));
    if (checked.includes("other") && f.other.trim()) {
      checklist.push({ key: "other", label: `Other: ${f.other.trim()}`, done: false });
    }

    if (isLot && !(count > 0)) return setError("Enter how many vehicles need rinsing");
    if (!isLot && !f.stock.trim()) return setError("Enter the stock # or VIN");
    if (service === "detail" && checklist.length === 0) return setError("Check at least one service");

    setBusy(true);
    setError("");
    try {
      await store.createRequest(profile!.company_id!, {
        service_type: service,
        vehicle_year: isLot ? null : f.year.trim() || null,
        vehicle_make: isLot ? null : f.make.trim() || null,
        vehicle_model: isLot ? null : f.model.trim() || null,
        vehicle_color: isLot ? null : f.color.trim() || null,
        stock_or_vin: isLot ? null : f.stock.trim(),
        vehicle_count: count,
        lot_area: isLot ? f.area.trim() || null : null,
        request_notes: f.notes.trim() || null,
        checklist,
        preferred_date: f.date || null,
      });
      // Next keeps this page mounted, so clear it for the next request.
      setF(EMPTY);
      setChecked([]);
      setFlash(`${serviceLabel(service)} request sent. We'll get it on the schedule.`);
      router.push("/portal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send request");
    }
    setBusy(false);
  }

  const title = { detail: "Request a Detail", lot_rinse: "Request a Lot Rinse", fuel_fill: "Request a Fuel Fill-Up" }[service];

  return (
    <>
      <Link href="/portal" className="text-sm font-semibold text-navy/60 hover:text-navy">
        ← Back
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>

      <form onSubmit={submit} className="space-y-6">
        {isLot ? (
          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Number of vehicles"
                inputMode="numeric"
                required
                value={f.count}
                onChange={set("count")}
                hint="Billed per vehicle rinsed"
              />
              <Field label="Area / row (optional)" placeholder="e.g. Front line, Row C" value={f.area} onChange={set("area")} />
            </div>
          </Card>
        ) : (
          <Card>
            <h2 className="mb-4 text-lg font-bold">Vehicle</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Year" inputMode="numeric" value={f.year} onChange={set("year")} />
              <Field label="Make" value={f.make} onChange={set("make")} />
              <Field label="Model" value={f.model} onChange={set("model")} />
              <Field label="Color" value={f.color} onChange={set("color")} />
              <Field label="Stock # or VIN" required value={f.stock} onChange={set("stock")} className="col-span-2 sm:col-span-4" />
            </div>
          </Card>
        )}

        {service === "detail" && (
          <Card>
            <h2 className="mb-4 text-lg font-bold">What does it need?</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {[...DETAIL_CHECKLIST, { key: "other", label: "Other" }].map((c) => (
                <label
                  key={c.key}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 transition ${
                    checked.includes(c.key) ? "border-rust bg-rust/5" : "border-line hover:bg-cream/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked.includes(c.key)}
                    onChange={() => toggle(c.key)}
                    className="h-5 w-5 accent-rust"
                  />
                  <span className="font-medium">{c.label}</span>
                </label>
              ))}
            </div>
            {checked.includes("other") && (
              <Field label="Other — describe" value={f.other} onChange={set("other")} className="mt-4" />
            )}
          </Card>
        )}

        <Card>
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Field label="Preferred date (optional)" type="date" value={f.date} onChange={set("date")} />
            <TextArea
              label="Notes (optional)"
              placeholder={service === "fuel_fill" ? "Fuel grade, fill level, where it's parked…" : "Anything we should know"}
              value={f.notes}
              onChange={set("notes")}
            />
          </div>
        </Card>

        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={busy} className="min-h-14 w-full text-lg sm:w-auto sm:px-10">
          {busy ? "Sending…" : "Submit request"}
        </Button>
      </form>
    </>
  );
}
