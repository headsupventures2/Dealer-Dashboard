"use client";

import { useEffect, useState } from "react";
import { ChecklistChips, JobHeading, JobWhen, StatusTag } from "@/components/jobs";
import { Button, Card } from "@/components/ui";
import { dateTime, toLocalInput } from "@/lib/format";
import { store } from "@/lib/store";
import { STATUSES, type Job, type JobStatus } from "@/lib/types";

export function RequestQueue({ companyId }: { companyId: string }) {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [tab, setTab] = useState<JobStatus>("new");

  useEffect(() => {
    store.listJobs(companyId).then(setJobs);
  }, [companyId]);

  function replace(job: Job) {
    setJobs((list) => list?.map((j) => (j.id === job.id ? job : j)) ?? null);
  }

  const shown = (jobs ?? []).filter((j) => j.status === tab);
  // Upcoming work reads best soonest-first; completed work newest-first.
  shown.sort((a, b) =>
    tab === "completed"
      ? (b.completed_at ?? "").localeCompare(a.completed_at ?? "")
      : (a.scheduled_at ?? a.preferred_date ?? a.created_at).localeCompare(b.scheduled_at ?? b.preferred_date ?? b.created_at),
  );

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">Requests</h2>
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm ring-1 ring-line">
        {STATUSES.map((s) => {
          const count = (jobs ?? []).filter((j) => j.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setTab(s.value)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold whitespace-nowrap ${
                tab === s.value ? "bg-navy text-white" : "text-navy/70 hover:bg-cream"
              }`}
            >
              {s.label}
              <span
                className={`rounded-full px-1.5 text-xs ${tab === s.value ? "bg-white/20" : "bg-navy/8"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {jobs === null ? (
        <p className="text-navy/60">Loading…</p>
      ) : shown.length === 0 ? (
        <Card className="py-10 text-center text-navy/55">
          Nothing {STATUSES.find((s) => s.value === tab)?.label.toLowerCase()} right now.
        </Card>
      ) : (
        <ul className="space-y-3">
          {shown.map((j) => (
            <li key={j.id}>
              <QueueCard job={j} onChange={replace} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function QueueCard({ job, onChange }: { job: Job; onChange(job: Job): void }) {
  const [when, setWhen] = useState(toLocalInput(job.scheduled_at));
  const [busy, setBusy] = useState(false);

  async function save(patch: Parameters<typeof store.updateJob>[1]) {
    setBusy(true);
    try {
      onChange(await store.updateJob(job.id, patch));
    } finally {
      setBusy(false);
    }
  }

  const scheduleChanged = when !== toLocalInput(job.scheduled_at);

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <JobHeading job={job} />
        <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
          <StatusTag status={job.status} />
          <JobWhen job={job} />
        </div>
      </div>

      <ChecklistChips job={job} />

      {job.request_notes && (
        <p className="rounded-lg bg-cream/60 px-3.5 py-2.5 text-sm text-navy/80">“{job.request_notes}”</p>
      )}

      {job.status !== "completed" && (
        <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_auto_12rem] sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Scheduled for</span>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="block min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3.5 text-base outline-none focus:border-rust focus:ring-2 focus:ring-rust/20"
            />
          </label>
          <Button
            disabled={busy || !when || !scheduleChanged}
            onClick={() =>
              save({
                scheduled_at: new Date(when).toISOString(),
                status: job.status === "new" ? "scheduled" : job.status,
              })
            }
          >
            {job.scheduled_at ? "Reschedule" : "Schedule"}
          </Button>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Status</span>
            <select
              value={job.status}
              disabled={busy}
              onChange={(e) => save({ status: e.target.value as JobStatus })}
              className="block min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3 text-base outline-none focus:border-rust"
            >
              {/* Completing a job happens in the job view (photos + mark done). */}
              {STATUSES.filter((s) => s.value !== "completed").map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <p className="text-xs text-navy/45">Requested {dateTime(job.created_at)}</p>
    </Card>
  );
}
