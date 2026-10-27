"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireRole, useAuth } from "@/components/auth";
import { Card, Footer, PreviewBanner, Wordmark } from "@/components/ui";
import { store } from "@/lib/store";
import type { Company } from "@/lib/types";

export default function PortalPage() {
  return (
    <RequireRole role="client">
      <Portal />
    </RequireRole>
  );
}

function Portal() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (profile?.company_id) store.getCompany(profile.company_id).then(setCompany);
  }, [profile?.company_id]);

  return (
    <>
      <PreviewBanner />
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8">
          <Wordmark />
          <button
            onClick={async () => {
              await signOut();
              router.replace("/login");
            }}
            className="min-h-11 text-sm font-semibold text-navy/70 hover:text-navy"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 sm:py-12">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-rust">Partner portal</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{company?.name ?? "…"}</h1>
        <Card className="mt-8 py-10 text-center text-navy/60">
          Your requests, schedule, and vehicle history will appear here.
        </Card>
      </main>
      <Footer />
    </>
  );
}
