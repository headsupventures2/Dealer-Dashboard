"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isDemo, setDemo, store } from "@/lib/store";
import { DEMO_LOGINS, loadDemo } from "@/lib/store/demo";
import type { Profile, Role } from "@/lib/types";

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  demo: boolean;
  /** Why the last sign-in didn't stick (e.g. a Google account that isn't a dealer login). */
  authError: string;
  signIn(email: string, password: string): Promise<Profile>;
  /** Signs into the sales demo. `fresh` rebuilds the sample data first. */
  startDemo(role: Role, fresh: boolean): Promise<Profile>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemoState] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const oauthError = takeOAuthError();
    store
      .currentProfile()
      .then((p) => {
        setDemoState(isDemo());
        setProfile(p);
        if (oauthError) setAuthError(oauthError);
      })
      .catch((err) => {
        setProfile(null);
        setAuthError(err instanceof Error ? err.message : "Sign in failed");
      })
      .finally(() => setLoading(false));
  }, []);

  const value: AuthState = {
    profile,
    loading,
    demo,
    authError,
    async startDemo(role, fresh) {
      setDemo(true);
      if (fresh) await loadDemo();
      const p = await store.signIn(DEMO_LOGINS[role].email, DEMO_LOGINS[role].password);
      setDemoState(true);
      setProfile(p);
      return p;
    },
    async signIn(email, password) {
      setAuthError("");
      const p = await store.signIn(email, password);
      setProfile(p);
      return p;
    },
    async signOut() {
      await store.signOut();
      setDemo(false);
      setDemoState(false);
      setProfile(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Reads (and clears from the address bar) an error Google/Supabase sent back after sign-in. */
function takeOAuthError() {
  const params = new URLSearchParams(window.location.search + "&" + window.location.hash.slice(1));
  const description = params.get("error_description");
  if (!description) return "";
  window.history.replaceState(null, "", window.location.pathname);
  return /signup/i.test(description)
    ? "That Google account isn't set up for the dashboard. Ask Leading Edge Detailing to add your email."
    : description;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function homeFor(role: Role) {
  return role === "admin" ? "/admin" : "/portal";
}

/** Renders children only for the given role; otherwise sends the user to login or their own home. */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!profile) router.replace("/login");
    else if (profile.role !== role) router.replace(homeFor(profile.role));
  }, [loading, profile, role, router]);

  if (loading || profile?.role !== role) {
    return <div className="flex flex-1 items-center justify-center text-navy/60">Loading…</div>;
  }
  return <>{children}</>;
}
