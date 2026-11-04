import type { ReactNode } from "react";
import { Footer, Logo } from "@/components/ui";

/** Centered logo + card layout for the signed-out pages (forgot / reset password). */
export function AuthScreen({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center">
            <Logo className="w-48" />
          </div>
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-navy/60">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
