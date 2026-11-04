"use client";

import { useState, type FormEvent } from "react";
import { Button, ErrorText, Field } from "@/components/ui";
import { store } from "@/lib/store";

export function ChangePasswordForm({ submitLabel = "Update password", onDone }: { submitLabel?: string; onDone?(): void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setDone(false);
    if (password.length < 8) return setError("Use at least 8 characters");
    if (password !== confirm) return setError("Passwords don't match");
    setBusy(true);
    setError("");
    try {
      await store.changePassword(password);
      setPassword("");
      setConfirm("");
      setDone(true);
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint="At least 8 characters"
      />
      <Field
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <ErrorText>{error}</ErrorText>
      {done && <p className="rounded-lg bg-navy/8 px-3.5 py-2.5 text-sm font-semibold text-navy">Password updated.</p>}
      <Button type="submit" disabled={busy} className="w-full sm:w-auto">
        {busy ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

/** Account page body shared by the dealer portal and the admin dashboard. */
export function AccountPanel({ email }: { email: string }) {
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Account</h1>
      <p className="mt-1 text-navy/60">Signed in as {email}</p>
      <div className="mt-6 rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-bold">Change password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
