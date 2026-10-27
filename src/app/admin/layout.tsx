"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { RequireRole, useAuth } from "@/components/auth";
import { CompaniesProvider, useCompanies } from "@/components/companies";
import { Footer, Logo, PreviewBanner, Wordmark } from "@/components/ui";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="admin">
      <CompaniesProvider>
        <AdminShell>{children}</AdminShell>
      </CompaniesProvider>
    </RequireRole>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-line bg-cream px-4 py-3 md:hidden">
          <Link href="/admin">
            <Wordmark />
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="min-h-11 rounded-lg bg-navy px-4 text-sm font-semibold text-white"
            aria-expanded={open}
          >
            {open ? "Close" : "Companies"}
          </button>
        </header>

        <aside
          className={`${open ? "block" : "hidden"} bg-navy text-white md:sticky md:top-0 md:block md:h-screen md:w-64 md:shrink-0`}
        >
          <Sidebar onNavigate={() => setOpen(false)} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <PreviewBanner />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
          <Footer />
        </div>
      </div>
    </>
  );
}

function Sidebar({ onNavigate }: { onNavigate(): void }) {
  const { companies, loading } = useCompanies();
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const item = (href: string, active: boolean) =>
    `block rounded-lg px-3 py-2.5 text-[15px] transition ${
      active ? "bg-white/12 font-semibold text-white" : "text-white/75 hover:bg-white/8 hover:text-white"
    }`;

  return (
    <div className="flex h-full flex-col px-3 py-4 md:py-6">
      <Link href="/admin" onClick={onNavigate} className="mb-6 hidden rounded-xl bg-cream px-4 py-3 md:block">
        <Logo className="mx-auto w-40" />
      </Link>

      <nav className="space-y-1">
        <Link href="/admin" onClick={onNavigate} className={item("/admin", pathname === "/admin")}>
          Overview
        </Link>
        <Link href="/admin/calendar" onClick={onNavigate} className={item("/admin/calendar", pathname === "/admin/calendar")}>
          Calendar
        </Link>
      </nav>

      <div className="mb-2 mt-6 flex items-center justify-between px-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Companies</span>
        <Link
          href="/admin/companies/new"
          onClick={onNavigate}
          className="rounded-md bg-rust px-2 py-1 text-xs font-semibold text-white hover:bg-rust-dark"
        >
          + Add
        </Link>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {loading && <p className="px-3 text-sm text-white/50">Loading…</p>}
        {!loading && companies.length === 0 && <p className="px-3 text-sm text-white/50">No companies yet</p>}
        {companies.map((c) => {
          const href = `/admin/companies/${c.id}`;
          return (
            <Link key={c.id} href={href} onClick={onNavigate} className={item(href, pathname === href)}>
              {c.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-white/10 px-3 pt-4 text-sm">
        <p className="truncate text-white/60">{profile?.email}</p>
        <button
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
          className="mt-2 font-semibold text-white hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
