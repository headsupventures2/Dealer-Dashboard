"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { homeFor, useAuth } from "@/components/auth";
import { ChangePasswordForm } from "@/components/password-form";

// The emailed reset link signs the user in (Supabase reads the token from the URL),
// then they choose a new password here.
export default function ResetPasswordPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <AuthScreen title="Set a new password">
        <p className="text-navy/60">Checking your link…</p>
      </AuthScreen>
    );
  }

  if (!profile) {
    return (
      <AuthScreen title="Link expired" subtitle="This reset link is invalid or has already been used.">
        <Link
          href="/forgot-password"
          className="flex min-h-11 items-center justify-center rounded-lg bg-rust px-5 font-semibold text-white hover:bg-rust-dark"
        >
          Send a new link
        </Link>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title="Set a new password" subtitle={profile.email}>
      <ChangePasswordForm submitLabel="Save and continue" onDone={() => router.replace(homeFor(profile.role))} />
    </AuthScreen>
  );
}
