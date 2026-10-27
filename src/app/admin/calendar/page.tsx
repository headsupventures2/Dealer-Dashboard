"use client";

import Link from "next/link";
import { useEffect, useState, type DragEvent, type ReactNode } from "react";
import { useCompanies } from "@/components/companies";
import { Card } from "@/components/ui";
import {
  addDays,
  atHour,
  CLOSE_HOUR,
  companyColors,
  DEFAULT_HOUR,
  hourLabel,
  HOURS,
  monthGrid,
  OPEN_HOUR,
  sameDay,
  startOfDay,
  startOfWeek,
} from "@/lib/calendar";
import { day as dayLabel, time } from "@/lib/format";
import { store } from "@/lib/store";
import { jobTitle, serviceLabel, type Job } from "@/lib/types";

type View = "month" | "week" | "day";

// Own MIME type: dragging a link also carries its URL as text/plain, which would clobber a plain-text id.
const DRAG_TYPE = "application/x-led-job";

export default function CalendarPage() {
  const { companies } = useCompanies();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [view, setView] = useState<View>("week");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [picking, setPicking] = useState<Date | null>(null);
  const [error, setError] = useState("");

  // Re-runs whenever the calendar is shown again, so it reflects the latest requests.
  useEffect(() => {
    store.listJobs().then(setJobs);
    // Phones start on the day view; a 7-column week is too tight to tap.
    if (window.matchMedia("(max-width: 767px)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time pick based on screen size
      setView("day");
    }
  }, []);

  const colors = companyColors(companies);
  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "";
  const scheduled = jobs.filter((j) => j.scheduled_at);
  const toSchedule = jobs
    .filter((j) => !j.scheduled_at && j.status !== "completed")
    .sort((a, b) => (a.preferred_date ?? "9999").localeCompare(b.preferred_date ?? "9999"));

  const jobsOn = (d: Date) =>
    scheduled
      .filter((j) => sameDay(new Date(j.scheduled_at!), d))
      .sort((a, b) => a.scheduled_at!.localeCompare(b.scheduled_at!));

  async function schedule(jobId: string, when: Date) {
    const job = jobs.find((j) => j.id === jobId);
    if (!job || job.status === "completed") return;
    setError("");
    try {
      const next = await store.updateJob(job.id, {
        scheduled_at: when.toISOString(),
        status: job.status === "new" ? "scheduled" : job.status,
      });
      setJobs((list) => list.map((j) => (j.id === next.id ? next : j)));
      setPicking(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule");
    }
  }

  /** Dropping on a whole day keeps a rescheduled job's time; new ones land at DEFAULT_HOUR. */
  function dropOnDay(jobId: string, d: Date) {
    const prev = jobs.find((j) => j.id === jobId)?.scheduled_at;
    const t = prev ? new Date(prev) : null;
    schedule(jobId, t ? atHour(d, t.getHours(), t.getMinutes()) : atHour(d, DEFAULT_HOUR));
  }

  function move(n: number) {
    if (view === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
    else setCursor(addDays(cursor, view === "week" ? 7 * n : n));
  }

  const weekStart = startOfWeek(cursor);
  const title =
    view === "month"
      ? cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : view === "week"
        ? `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${addDays(weekStart, 6).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        : cursor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const chip = (j: Job, withTime = true) => (
    <JobChip key={j.id} job={j} color={colors.get(j.company_id)} company={companyName(j.company_id)} withTime={withTime} />
  );

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Calendar</h1>
        <div className="flex rounded-lg bg-white p-1 shadow-sm ring-1 ring-line">
          {(["month", "week", "day"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`min-h-10 rounded-md px-4 text-sm font-semibold capitalize ${view === v ? "bg-navy text-white" : "text-navy/70 hover:bg-cream"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <ToSchedule jobs={toSchedule} colors={colors} companyName={companyName} />

      <div className="mb-3 mt-6 flex items-center justify-between gap-3">
        <h2 className="font-brand text-lg font-bold">{title}</h2>
        <div className="flex items-center gap-1">
          <NavButton onClick={() => move(-1)} label="Previous">‹</NavButton>
          <button
            onClick={() => setCursor(startOfDay(new Date()))}
            className="min-h-10 rounded-lg border border-navy/15 bg-white px-3 text-sm font-semibold hover:bg-navy/5"
          >
            Today
          </button>
          <NavButton onClick={() => move(1)} label="Next">›</NavButton>
        </div>
      </div>

      {error && <p className="mb-3 rounded-lg bg-rust/10 px-3.5 py-2.5 text-sm text-rust-dark">{error}</p>}

      {view === "month" ? (
        <Card flush>
          <div className="grid grid-cols-7 border-b border-line bg-cream/60 text-center text-xs font-semibold uppercase tracking-wider text-navy/55">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthGrid(cursor).map((d) => {
              const list = jobsOn(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              return (
                <DropZone
                  key={d.toISOString()}
                  label={d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  onDrop={(id) => dropOnDay(id, d)}
                  onClick={() => {
                    setCursor(d);
                    setView("day");
                  }}
                  className={`min-h-20 border-b border-r border-line p-1 text-left sm:min-h-28 sm:p-1.5 [&:nth-child(7n)]:border-r-0 ${inMonth ? "" : "bg-cream/40"}`}
                >
                  <DayNumber d={d} faded={!inMonth} />
                  <div className="mt-1 space-y-1">
                    {list.slice(0, 3).map((j) => chip(j, false))}
                    {list.length > 3 && <p className="px-1 text-xs font-semibold text-navy/60">+{list.length - 3} more</p>}
                  </div>
                </DropZone>
              );
            })}
          </div>
        </Card>
      ) : (
        <TimeGrid
          days={view === "week" ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)) : [cursor]}
          jobsOn={jobsOn}
          chip={chip}
          onDropSlot={(id, when) => schedule(id, when)}
          onPickSlot={setPicking}
          onPickDay={(d) => {
            setCursor(d);
            setView("day");
          }}
        />
      )}

      <Legend companies={companies.map((c) => ({ name: c.name, color: colors.get(c.id)! }))} />

      {picking && (
        <Picker
          when={picking}
          jobs={toSchedule}
          colors={colors}
          companyName={companyName}
          onPick={(id) => schedule(id, picking)}
          onClose={() => setPicking(null)}
        />
      )}
    </>
  );
}

function TimeGrid({
  days,
  jobsOn,
  chip,
  onDropSlot,
  onPickSlot,
  onPickDay,
}: {
  days: Date[];
  jobsOn(d: Date): Job[];
  chip(j: Job, withTime?: boolean): ReactNode;
  onDropSlot(jobId: string, when: Date): void;
  onPickSlot(when: Date): void;
  onPickDay(d: Date): void;
}) {
  const cols = { gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` };
  const outside = (d: Date) =>
    jobsOn(d).filter((j) => {
      const h = new Date(j.scheduled_at!).getHours();
      return h < OPEN_HOUR || h >= CLOSE_HOUR;
    });
  const hasOutside = days.some((d) => outside(d).length > 0);

  return (
    <Card flush>
      <div className="grid border-b border-line bg-cream/60" style={cols}>
        <div />
        {days.map((d) => (
          <button
            key={d.toISOString()}
            onClick={() => onPickDay(d)}
            className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-navy/60 hover:text-navy"
          >
            {d.toLocaleDateString("en-US", { weekday: "short" })} <DayNumber d={d} inline />
          </button>
        ))}
      </div>

      {hasOutside && (
        <div className="grid border-b border-line" style={cols}>
          <div className="px-1.5 py-2 text-right text-[11px] leading-tight text-navy/50">Other times</div>
          {days.map((d) => (
            <div key={d.toISOString()} className="space-y-1 border-l border-line p-1">
              {outside(d).map((j) => chip(j))}
            </div>
          ))}
        </div>
      )}

      {HOURS.map((h) => (
        <div key={h} className="grid border-b border-line last:border-0" style={cols}>
          <div className="px-1.5 pt-1 text-right text-[11px] text-navy/50">{hourLabel(h)}</div>
          {days.map((d) => {
            const slot = atHour(d, h);
            const list = jobsOn(d).filter((j) => new Date(j.scheduled_at!).getHours() === h);
            return (
              <DropZone
                key={d.toISOString()}
                onDrop={(id) => onDropSlot(id, slot)}
                onClick={() => onPickSlot(slot)}
                className="min-h-14 space-y-1 border-l border-line p-1 text-left"
                label={`Schedule ${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${hourLabel(h)}`}
              >
                {list.map((j) => chip(j))}
              </DropZone>
            );
          })}
        </div>
      ))}
    </Card>
  );
}

/** A day or time slot: tap it to schedule something there, or drop a request onto it. */
function DropZone({
  onDrop,
  onClick,
  className,
  label,
  children,
}: {
  onDrop(jobId: string): void;
  onClick(): void;
  className: string;
  label?: string;
  children: ReactNode;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      onDragOver={(e: DragEvent) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData(DRAG_TYPE);
        if (id) onDrop(id);
      }}
      className={`${className} cursor-pointer transition-colors hover:bg-cream/50 ${over ? "!bg-rust/10 ring-2 ring-rust ring-inset" : ""}`}
    >
      {children}
    </div>
  );
}

function JobChip({
  job,
  color = "#1F2F4F",
  company,
  withTime,
}: {
  job: Job;
  color?: string;
  company: string;
  withTime: boolean;
}) {
  const done = job.status === "completed";
  return (
    <Link
      href={`/admin/jobs/${job.id}`}
      draggable={!done}
      onDragStart={(e) => e.dataTransfer.setData(DRAG_TYPE, job.id)}
      onClick={(e) => e.stopPropagation()}
      title={`${company} · ${serviceLabel(job.service_type)} · ${jobTitle(job)}`}
      className={`block truncate rounded-md border-l-[3px] px-1.5 py-1 text-xs leading-tight text-navy ${done ? "opacity-55" : ""}`}
      style={{ borderLeftColor: color, backgroundColor: `${color}1F` }}
    >
      {withTime && <span className="font-semibold">{time(job.scheduled_at!)} </span>}
      {done && "✓ "}
      {jobTitle(job)}
    </Link>
  );
}

function ToSchedule({
  jobs,
  colors,
  companyName,
}: {
  jobs: Job[];
  colors: Map<string, string>;
  companyName(id: string): string;
}) {
  return (
    <Card className="!p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-brand font-bold">
          To schedule <span className="font-sans font-normal text-navy/50">({jobs.length})</span>
        </h2>
        <p className="text-xs text-navy/55">Drag onto the calendar, or tap a time slot to pick one</p>
      </div>
      {jobs.length === 0 ? (
        <p className="text-sm text-navy/55">Everything is on the calendar.</p>
      ) : (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {jobs.map((j) => (
            <li
              key={j.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData(DRAG_TYPE, j.id)}
              className="w-52 shrink-0 cursor-grab rounded-lg border-l-4 bg-cream/60 px-3 py-2 active:cursor-grabbing"
              style={{ borderLeftColor: colors.get(j.company_id) }}
            >
              <p className="truncate text-xs font-semibold text-navy/60">{companyName(j.company_id)}</p>
              <p className="truncate text-sm font-semibold">{jobTitle(j)}</p>
              <p className="text-xs text-navy/55">
                {serviceLabel(j.service_type)}
                {j.preferred_date && <> · Pref. {dayLabel(j.preferred_date)}</>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Picker({
  when,
  jobs,
  colors,
  companyName,
  onPick,
  onClose,
}: {
  when: Date;
  jobs: Job[];
  colors: Map<string, string>;
  companyName(id: string): string;
  onPick(jobId: string): void;
  onClose(): void;
}) {
  return (
    <div role="dialog" aria-label="Schedule a request" className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 sm:items-center" onClick={onClose}>
      <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 sm:max-w-md sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold text-rust">Schedule for</p>
        <h2 className="font-brand text-xl font-bold">
          {when.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {time(when.toISOString())}
        </h2>
        {jobs.length === 0 ? (
          <p className="mt-4 text-navy/60">No requests waiting to be scheduled.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {jobs.map((j) => (
              <li key={j.id}>
                <button
                  onClick={() => onPick(j.id)}
                  className="block w-full rounded-lg border border-line border-l-4 px-4 py-3 text-left hover:bg-cream/50"
                  style={{ borderLeftColor: colors.get(j.company_id) }}
                >
                  <p className="text-xs font-semibold text-navy/60">
                    {companyName(j.company_id)} · {serviceLabel(j.service_type)}
                  </p>
                  <p className="font-semibold">{jobTitle(j)}</p>
                  {j.preferred_date && <p className="text-xs text-navy/55">Preferred {dayLabel(j.preferred_date)}</p>}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button onClick={onClose} className="mt-4 min-h-11 w-full rounded-lg border border-navy/15 font-semibold hover:bg-navy/5">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Legend({ companies }: { companies: { name: string; color: string }[] }) {
  if (companies.length === 0) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {companies.map((c) => (
        <li key={c.name} className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: c.color }} />
          {c.name}
        </li>
      ))}
    </ul>
  );
}

function NavButton({ onClick, label, children }: { onClick(): void; label: string; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-navy/15 bg-white text-xl hover:bg-navy/5"
    >
      {children}
    </button>
  );
}

function DayNumber({ d, faded = false, inline = false }: { d: Date; faded?: boolean; inline?: boolean }) {
  const today = sameDay(d, new Date());
  return (
    <span
      className={`${inline ? "ml-1" : ""} inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-bold ${
        today ? "bg-rust text-white" : faded ? "text-navy/35" : "text-navy"
      }`}
    >
      {d.getDate()}
    </span>
  );
}
