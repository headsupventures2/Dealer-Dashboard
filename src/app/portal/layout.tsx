"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { RequireRole, useAuth } from "@/components/auth";
import { Footer, PreviewBanner, Wordmark } from "@/components/ui";

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
      <PreviewBanner />
      <header className="border-b border-line bg-cream">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8">
          <Link href="/portal">
            <Wordmark />
          </Link>
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 sm:py-12">{children}</main>
      <Footer />
    </>
  );
}
