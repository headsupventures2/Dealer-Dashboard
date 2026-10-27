"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "@/components/auth";

export default function Home() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) router.replace(profile ? homeFor(profile.role) : "/login");
  }, [loading, profile, router]);

  return <div className="flex flex-1 items-center justify-center text-navy/60">Loading…</div>;
}
