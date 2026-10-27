"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCompanies } from "@/components/companies";
import { JobHeading, JobWhen, StatusTag } from "@/components/jobs";
import { PhotoSection } from "@/components/photo-section";
import { Button, Card, ErrorText, Field, TextArea } from "@/components/ui";
import { dateTime, day, money } from "@/lib/format";
import { store } from "@/lib/store";
import { lockPrice, type Job, type JobPatch, type Photo } from "@/lib/types";

interface Draft {
  clientNotes: string;
  internalNotes: string;
  gallons: string;
  fuelAmount: string;
}

function draftFrom(job: Job, internalNotes: string): Draft {
  return {
    clientNotes: job.client_notes ?? "",
    internalNotes,
    gallons: job.fuel_gallons?.toString() ?? "",
    fuelAmount: job.fuel_amount?.toString() ?? "",
  };
}

function num(s: string) {
  const n = Number(s.replace(/[$,\s]/g, ""));
  return s.trim() === "" || !Number.isFinite(n) ? null : n;
}

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const { companies } = useCompanies();
  const [job, setJob] = useState<Job | null | undefined>(undefined);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [saved, setSaved] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  // Re-runs whenever this page is shown again, so it always reflects the latest data.
  useEffect(() => {
    Promise.all([store.getJob(id), store.getInternalNotes(id), store.listPhotos(id)]).then(([j, notes, p]) => {
      setJob(j);
      setPhotos(p);
      if (j) {
        const d = draftFrom(j, notes);
        setSaved(d);
        setDraft(d);
      }
    });
  }, [id]);

  if (job === undefined || (job && !draft)) return <p className="text-navy/60">Loading…</p>;
  if (job === null || !draft || !saved) return <p className="text-navy/60">Job not found.</p>;

  const company = companies.find((c) => c.id === job.company_id);
  const isFuel = job.service_type === "fuel_fill";
  const done = job.status === "completed";
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const set = (k: keyof Draft) => (e: { target: { value: string } }) => {
    setSavedMsg("");
    setDraft({ ...draft, [k]: e.target.value });
  };

  async function persist(extra: JobPatch = {}) {
    const patch: JobPatch = { client_notes: draft!.clientNotes.trim() || null, ...extra };
    if (isFuel) {
      patch.fuel_gallons = num(draft!.gallons);
      patch.fuel_amount = num(draft!.fuelAmount);
    }
    const next = await store.updateJob(job!.id, patch);
    if (draft!.internalNotes !== saved!.internalNotes) await store.setInternalNotes(job!.id, draft!.internalNotes);
    setJob(next);
    setSaved(draft);
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setBusy(false);
  }

  const save = () =>
    run(async () => {
      await persist();
      setSavedMsg("Saved");
    });

  const markDone = () =>
    run(async () => {
      if (isFuel && (num(draft.gallons) == null || num(draft.fuelAmount) == null)) {
        throw new Error("Enter gallons and fuel cost before marking done");
      }
      if (!photos.some((p) => p.type === "after") && !window.confirm("No after photos yet. Mark done anyway?")) return;
      await persist({ status: "completed" });
    });

  const reopen = () =>
    run(async () => {
      if (!window.confirm("Reopen this job? Its locked price will be cleared and re-locked when you mark it done again.")) return;
      setJob(
        await store.updateJob(job.id, {
          status: "in_progress",
          completed_at: null,
          price_at_completion: null,
          cost_at_completion: null,
        }),
      );
    });

  async function toggleItem(key: string) {
    const checklist = job!.checklist.map((c) => (c.key === key ? { ...c, done: !c.done } : c));
    setJob({ ...job!, checklist }); // instant feedback in the field
    try {
      setJob(await store.updateJob(job!.id, { checklist }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save checklist");
    }
  }

  const willLock = company ? lockPrice(job, company).price_at_completion : null;

  return (
    <div className="pb-28 md:pb-0">
      <Link href={`/admin/companies/${job.company_id}`} className="text-sm font-semibold text-navy/60 hover:text-navy">
        ← {company?.name ?? "Back"}
      </Link>

      <div className="mb-6 mt-3 flex flex-wrap items-start justify-between gap-3">
        <JobHeading job={job} large />
        <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
          <StatusTag status={job.status} />
          <JobWhen job={job} />
        </div>
      </div>

      {done && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-navy px-5 py-4 text-white">
          <div>
            <p className="font-semibold">Completed {dateTime(job.completed_at)}</p>
            <p className="text-sm text-white/75">
              {money(job.price_at_completion)} locked in
              {isFuel && job.fuel_amount != null && <> · {money(job.fuel_amount)} fuel billed through</>}
            </p>
          </div>
          <button onClick={reopen} disabled={busy} className="text-sm font-semibold text-white/80 underline hover:text-white">
            Reopen job
          </button>
        </div>
      )}

      <div className="space-y-5">
        {(job.request_notes || job.preferred_date) && (
          <Card>
            <h2 className="mb-2 text-lg font-bold">Dealer request</h2>
            {job.request_notes && <p className="text-navy/80">“{job.request_notes}”</p>}
            {job.preferred_date && <p className="mt-2 text-sm text-navy/60">Preferred date: {day(job.preferred_date)}</p>}
          </Card>
        )}

        {job.checklist.length > 0 && (
          <Card>
            <h2 className="mb-3 text-lg font-bold">Checklist</h2>
            <div className="space-y-2">
              {job.checklist.map((c) => (
                <label
                  key={c.key}
                  className={`flex min-h-13 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
                    c.done ? "border-navy/30 bg-navy/5" : "border-line"
                  }`}
                >
                  <input type="checkbox" checked={c.done} onChange={() => toggleItem(c.key)} className="h-6 w-6 accent-navy" />
                  <span className={`font-medium ${c.done ? "text-navy/60 line-through" : ""}`}>{c.label}</span>
                </label>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <h2 className="mb-4 text-lg font-bold">Photos</h2>
          <div className="space-y-6">
            <PhotoSection job={job} type="before" photos={photos} onChange={setPhotos} />
            <PhotoSection job={job} type="after" photos={photos} onChange={setPhotos} />
          </div>
        </Card>

        {isFuel && (
          <Card>
            <h2 className="mb-4 text-lg font-bold">Fuel</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Gallons" inputMode="decimal" value={draft.gallons} onChange={set("gallons")} />
              <Field
                label="Fuel cost ($)"
                inputMode="decimal"
                value={draft.fuelAmount}
                onChange={set("fuelAmount")}
                hint="Billed through to the dealer"
              />
            </div>
          </Card>
        )}

        <Card>
          <h2 className="mb-4 text-lg font-bold">Notes</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextArea
              label="Notes for the dealer"
              placeholder="Shown to the dealership"
              value={draft.clientNotes}
              onChange={set("clientNotes")}
            />
            <TextArea
              label="Internal notes"
              placeholder="Only Leading Edge sees these"
              value={draft.internalNotes}
              onChange={set("internalNotes")}
            />
          </div>
        </Card>

        <ErrorText>{error}</ErrorText>
      </div>

      {/* Action bar: pinned to the bottom of the screen on phones. */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Button variant="ghost" onClick={save} disabled={busy || !dirty} className="shrink-0">
            {savedMsg && !dirty ? savedMsg : "Save"}
          </Button>
          {!done && (
            <Button onClick={markDone} disabled={busy} className="min-h-12 flex-1 text-base md:flex-none md:px-10">
              ✓ Mark Done{willLock != null && <span className="font-normal opacity-80">· {money(willLock)}</span>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
