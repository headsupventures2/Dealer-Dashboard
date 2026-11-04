"use client";

import { useAuth } from "@/components/auth";
import { AccountPanel } from "@/components/password-form";

export default function AdminAccountPage() {
  const { profile } = useAuth();
  return <AccountPanel email={profile?.email ?? ""} />;
}
