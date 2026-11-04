"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ModeBanner } from "@/components/mode-banner";
import { homeFor, useAuth } from "@/components/auth";
import { Button, ErrorText, Field, Footer, Logo } from "@/components/ui";
import { isGoogleSignInEnabled, isSupabaseConfigured, store } from "@/lib/store";
import { PREVIEW_ADMIN } from "@/lib/store/preview";
import type { Role } from "@/lib/types";

export default function LoginPage() {
  const { profile, loading, authError, signIn, startDemo } = useAuth();
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

  async function signInWithGoogle() {
    setBusy(true);
    setError("");
    try {
      await store.signInWithGoogle(`${window.location.origin}/`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(false);
    }
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
            {isGoogleSignInEnabled && (
              <>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={busy}
                  className="mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-navy/20 bg-white px-5 text-[15px] font-semibold text-navy transition hover:bg-navy/5 disabled:opacity-50"
                >
                  <GoogleLogo />
                  Sign in with Google
                </button>
                <div className="mt-5 flex items-center gap-3 text-xs uppercase tracking-wider text-navy/45">
                  <span className="h-px flex-1 bg-line" />
                  or use email
                  <span className="h-px flex-1 bg-line" />
                </div>
              </>
            )}
            <form onSubmit={onSubmit} className={`${isGoogleSignInEnabled ? "mt-5" : "mt-6"} space-y-4`}>
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
              <ErrorText>{error || authError}</ErrorText>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Signing in…" : "Sign in"}
              </Button>
              <Link href="/forgot-password" className="block text-center text-sm font-semibold text-navy/60 hover:text-navy">
                Forgot password?
              </Link>
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

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
