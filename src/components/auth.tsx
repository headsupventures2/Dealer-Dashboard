"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { store } from "@/lib/store";
import type { Profile, Role } from "@/lib/types";

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<Profile>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store
      .currentProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const value: AuthState = {
    profile,
    loading,
    async signIn(email, password) {
      const p = await store.signIn(email, password);
      setProfile(p);
      return p;
    },
    async signOut() {
      await store.signOut();
      setProfile(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
