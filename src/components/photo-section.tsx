"use client";

import { useState } from "react";
import { resizeImage } from "@/lib/images";
import { store } from "@/lib/store";
import type { Job, Photo, PhotoType } from "@/lib/types";

/** Before or after photos for a job: multi-upload straight from the phone camera or library. */
export function PhotoSection({
  job,
  type,
  photos,
  onChange,
}: {
  job: Job;
  type: PhotoType;
  photos: Photo[];
  onChange(photos: Photo[]): void;
}) {
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const mine = photos.filter((p) => p.type === type);
  const label = type === "before" ? "Before" : "After";

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    let all = photos;
    const list = Array.from(files);
    try {
      for (const [i, file] of list.entries()) {
        setProgress(`Uploading ${i + 1} of ${list.length}…`);
        const added = await store.uploadPhotos(job, type, [await resizeImage(file)]);
        all = [...all, ...added];
        onChange(all);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setProgress("");
  }

  async function remove(photo: Photo) {
    if (!window.confirm("Delete this photo?")) return;
    await store.deletePhoto(photo.id);
    onChange(photos.filter((p) => p.id !== photo.id));
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">
          {label} <span className="font-normal text-navy/50">({mine.length})</span>
        </h3>
        <label
          className={`inline-flex min-h-11 cursor-pointer items-center rounded-lg px-4 text-sm font-semibold text-white ${
            type === "before" ? "bg-maroon hover:bg-maroon/90" : "bg-rust hover:bg-rust-dark"
          } ${progress ? "pointer-events-none opacity-60" : ""}`}
        >
          {progress || `+ Add ${label.toLowerCase()} photos`}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              upload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {error && <p className="mb-2 text-sm text-rust-dark">{error}</p>}
      {mine.length === 0 ? (
        <p className="rounded-lg border border-dashed border-navy/20 py-6 text-center text-sm text-navy/50">
          No {label.toLowerCase()} photos yet
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
          {mine.map((p) => (
            <li key={p.id} className="relative">
              <a href={p.url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- signed/object URLs, not optimizable */}
                <img src={p.url} alt={`${label} photo`} className="aspect-square w-full rounded-lg object-cover" />
              </a>
              <button
                onClick={() => remove(p)}
                aria-label="Delete photo"
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-navy/80 text-sm text-white"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
