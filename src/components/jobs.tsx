import { dateTime, day } from "@/lib/format";
import { serviceLabel, STATUSES, jobTitle, type Job, type JobStatus } from "@/lib/types";

const statusStyles: Record<JobStatus, string> = {
  new: "bg-rust/12 text-rust-dark",
  scheduled: "bg-navy/10 text-navy",
  in_progress: "bg-maroon/12 text-maroon",
  completed: "bg-navy text-white",
};

export function StatusTag({ status }: { status: JobStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${statusStyles[status]}`}>
      {STATUSES.find((s) => s.value === status)?.label}
    </span>
  );
}

/** When the job is happening: the scheduled time if set, otherwise the dealer's preferred date. */
export function JobWhen({ job }: { job: Job }) {
  if (job.scheduled_at) return <span>{dateTime(job.scheduled_at)}</span>;
  if (job.preferred_date) return <span className="text-navy/60">Preferred {day(job.preferred_date)}</span>;
  return <span className="text-navy/50">Not scheduled yet</span>;
}

export function JobHeading({ job, large = false }: { job: Job; large?: boolean }) {
  const sub =
    job.service_type === "lot_rinse"
      ? null
      : [job.vehicle_color, job.stock_or_vin && `#${job.stock_or_vin}`].filter(Boolean).join(" · ");
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">{serviceLabel(job.service_type)}</p>
      <p className={`mt-0.5 font-semibold ${large ? "font-brand text-2xl font-bold" : "truncate"}`}>{jobTitle(job)}</p>
      {sub && <p className="truncate text-sm text-navy/60">{sub}</p>}
    </div>
  );
}

export function ChecklistChips({ job }: { job: Job }) {
  if (job.checklist.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {job.checklist.map((c) => (
        <li key={c.key} className="rounded-md border border-line bg-cream/60 px-2 py-0.5 text-xs text-navy/80">
          {c.label}
        </li>
      ))}
    </ul>
  );
}
