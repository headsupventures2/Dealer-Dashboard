"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { homeFor, useAuth } from "@/components/auth";
import { isSupabaseConfigured } from "@/lib/store";

/** Thin strip at the top: demo controls in demo mode, or a reminder in preview mode. */
export function ModeBanner() {
  const { demo, profile, startDemo, signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (demo && profile) {
    const other = profile.role === "admin" ? "client" : "admin";
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-maroon px-4 py-1.5 text-center text-xs text-white">
        <span>
          <span className="font-semibold">Demo</span> · sample data only
        </span>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const p = await startDemo(other, false);
            router.replace(homeFor(p.role));
            setBusy(false);
          }}
          className="font-semibold underline underline-offset-2"
        >
          Switch to {other === "client" ? "dealer" : "Leading Edge"} view
        </button>
        <button
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
          className="font-semibold underline underline-offset-2"
        >
          Exit demo
        </button>
      </div>
    );
  }

  if (isSupabaseConfigured) return null;
  return (
    <div className="bg-maroon px-4 py-1.5 text-center text-xs text-white">
      Preview mode — data is saved in this browser only. Connect Supabase to go live.
    </div>
  );
}
