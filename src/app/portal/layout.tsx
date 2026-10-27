"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ModeBanner } from "@/components/mode-banner";
import { RequireRole, useAuth } from "@/components/auth";
import { Footer, Wordmark } from "@/components/ui";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="client">
      <PortalShell>{children}</PortalShell>
    </RequireRole>
  );
}

function PortalShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <>
      <ModeBanner />
      <header className="border-b border-line bg-cream">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8">
          <Link href="/portal">
            <Wordmark />
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold sm:gap-6">
            <Link href="/portal/history" className="hidden text-navy/70 hover:text-navy sm:block">
              Vehicle history
            </Link>
            <button
              onClick={async () => {
                await signOut();
                router.replace("/login");
              }}
              className="min-h-11 text-navy/70 hover:text-navy"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 sm:py-12">{children}</main>
      <Footer />
    </>
  );
}
