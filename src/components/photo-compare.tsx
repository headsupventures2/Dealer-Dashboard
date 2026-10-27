"use client";

import { useState } from "react";
import type { Photo } from "@/lib/types";

/** Before and after photos side by side, paired in upload order. Tap any photo to view it full screen. */
export function PhotoCompare({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<Photo | null>(null);
  const before = photos.filter((p) => p.type === "before");
  const after = photos.filter((p) => p.type === "after");
  const rows = Math.max(before.length, after.length);

  if (rows === 0) return <p className="text-navy/55">No photos for this job.</p>;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <p className="font-brand text-sm font-bold uppercase tracking-[0.18em] text-maroon">Before</p>
        <p className="font-brand text-sm font-bold uppercase tracking-[0.18em] text-rust">After</p>
        {Array.from({ length: rows }).flatMap((_, i) =>
          [before[i], after[i]].map((p, side) =>
            p ? (
              <button key={p.id} onClick={() => setOpen(p)} className="block overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element -- signed/object URLs, not optimizable */}
                <img src={p.url} alt={`${p.type} photo`} className="aspect-[4/3] w-full object-cover transition hover:scale-[1.02]" />
              </button>
            ) : (
              <div key={`empty-${i}-${side}`} className="aspect-[4/3] rounded-lg border border-dashed border-navy/15" />
            ),
          ),
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Photo"
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy/95 p-4"
        >
          <p className="mb-3 font-brand text-sm font-bold uppercase tracking-[0.2em] text-white/80">{open.type}</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- signed/object URLs, not optimizable */}
          <img src={open.url} alt={`${open.type} photo`} className="max-h-[80vh] max-w-full rounded-lg object-contain" />
          <button className="mt-4 min-h-11 rounded-lg px-6 font-semibold text-white ring-1 ring-white/30">Close</button>
        </div>
      )}
    </>
  );
}
