"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthScreen } from "@/components/auth-screen";
import { Button, ErrorText, Field } from "@/components/ui";
import { store } from "@/lib/store";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await store.sendPasswordReset(email, `${window.location.origin}/reset-password`);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email");
    }
    setBusy(false);
  }

  return (
    <AuthScreen title="Reset your password" subtitle="We'll email you a link to set a new one.">
      {sent ? (
        <p className="rounded-lg bg-navy/8 px-3.5 py-3 text-sm text-navy">
          If <span className="font-semibold">{email}</span> has an account, a reset link is on its way. Check your inbox and spam folder.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-navy/60 hover:text-navy">
        ← Back to sign in
      </Link>
    </AuthScreen>
  );
}
