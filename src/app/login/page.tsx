"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ModeBanner } from "@/components/mode-banner";
import { homeFor, useAuth } from "@/components/auth";
import { Button, ErrorText, Field, Footer, Logo } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/store";
import { PREVIEW_ADMIN } from "@/lib/store/preview";
import type { Role } from "@/lib/types";

export default function LoginPage() {
  const { profile, loading, signIn, startDemo } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState<Role | null>(null);

  useEffect(() => {
    if (!loading && profile) router.replace(homeFor(profile.role));
  }, [loading, profile, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const p = await signIn(email, password);
      // Next keeps this page mounted after navigating away, so clear it for the next sign-in.
      setEmail("");
      setPassword("");
      router.replace(homeFor(p.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    }
    setBusy(false);
  }

  async function openDemo(role: Role) {
    setDemoBusy(role);
    setError("");
    try {
      const p = await startDemo(role, true);
      router.replace(homeFor(p.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the demo");
    }
    setDemoBusy(null);
  }

  return (
    <>
      <ModeBanner />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center">
            <Logo className="w-60" />
          </div>
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-semibold">Sign in</h1>
            <p className="mt-1 text-sm text-navy/60">Dealer partners and Leading Edge team</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Field
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Field
                label="Password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <ErrorText>{error}</ErrorText>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </div>
          <div className="mt-5 rounded-2xl border border-line bg-white/60 p-5 text-center">
            <p className="font-brand font-bold">See it in action</p>
            <p className="mt-1 text-sm text-navy/60">Explore with sample data. No real client info is shown.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="secondary" disabled={demoBusy !== null} onClick={() => openDemo("client")}>
                {demoBusy === "client" ? "Loading…" : "Dealer view"}
              </Button>
              <Button variant="ghost" disabled={demoBusy !== null} onClick={() => openDemo("admin")}>
                {demoBusy === "admin" ? "Loading…" : "Admin view"}
              </Button>
            </div>
          </div>
          {!isSupabaseConfigured && (
            <p className="mt-4 text-center text-xs text-navy/55">
              Preview admin: {PREVIEW_ADMIN.email} / {PREVIEW_ADMIN.password}
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
