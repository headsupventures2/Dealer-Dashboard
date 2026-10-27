"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { JobHeading, JobWhen, StatusTag } from "@/components/jobs";
import { PhotoCompare } from "@/components/photo-compare";
import { Card } from "@/components/ui";
import { dateTime, day, money } from "@/lib/format";
import { store } from "@/lib/store";
import type { Job, Photo } from "@/lib/types";

export default function ClientJobPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null | undefined>(undefined);
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    Promise.all([store.getJob(id), store.listPhotos(id)]).then(([j, p]) => {
      setJob(j);
      setPhotos(p);
    });
  }, [id]);

  if (job === undefined) return <p className="text-navy/60">Loading…</p>;
  if (job === null) return <p className="text-navy/60">Vehicle not found.</p>;

  const done = job.status === "completed";

  return (
    <>
      <Link href={done ? "/portal/history" : "/portal"} className="text-sm font-semibold text-navy/60 hover:text-navy">
        ← {done ? "Vehicle history" : "Home"}
      </Link>

      <div className="mb-6 mt-3 flex flex-wrap items-start justify-between gap-3">
        <JobHeading job={job} large />
        <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
          <StatusTag status={job.status} />
          {done ? <span>Completed {dateTime(job.completed_at)}</span> : <JobWhen job={job} />}
        </div>
      </div>

      <div className="space-y-5">
        {done && (
          <Card>
            <PhotoCompare photos={photos} />
          </Card>
        )}

        {job.checklist.length > 0 && (
          <Card>
            <h2 className="mb-3 text-lg font-bold">{done ? "What we did" : "What you requested"}</h2>
            <ul className="space-y-2">
              {job.checklist.map((c) => (
                <li key={c.key} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      c.done ? "bg-navy text-white" : "border border-navy/25 text-navy/30"
                    }`}
                  >
                    {c.done ? "✓" : ""}
                  </span>
                  <span className={c.done || !done ? "" : "text-navy/50"}>{c.label}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {done && job.service_type === "fuel_fill" && job.fuel_gallons != null && (
          <Card>
            <h2 className="mb-2 text-lg font-bold">Fuel</h2>
            <p>
              {job.fuel_gallons} gallons · {money(job.fuel_amount)}
            </p>
          </Card>
        )}

        {job.client_notes && (
          <Card>
            <h2 className="mb-2 text-lg font-bold">Notes from Leading Edge</h2>
            <p className="whitespace-pre-line text-navy/85">{job.client_notes}</p>
          </Card>
        )}

        {(job.request_notes || job.preferred_date) && (
          <Card>
            <h2 className="mb-2 text-lg font-bold">Your request</h2>
            {job.request_notes && <p className="text-navy/80">“{job.request_notes}”</p>}
            {job.preferred_date && <p className="mt-2 text-sm text-navy/60">Preferred date: {day(job.preferred_date)}</p>}
            <p className="mt-2 text-sm text-navy/50">Requested {dateTime(job.created_at)}</p>
          </Card>
        )}
      </div>
    </>
  );
}
