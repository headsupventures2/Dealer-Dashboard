"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { store } from "@/lib/store";
import type { Company } from "@/lib/types";

interface CompaniesState {
  companies: Company[];
  loading: boolean;
  refresh(): Promise<void>;
}

const CompaniesContext = createContext<CompaniesState | null>(null);

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setCompanies(await store.listCompanies());
    setLoading(false);
  }, []);

  useEffect(() => {
    store.listCompanies().then((list) => {
      setCompanies(list);
      setLoading(false);
    });
  }, []);

  return <CompaniesContext.Provider value={{ companies, loading, refresh }}>{children}</CompaniesContext.Provider>;
}

export function useCompanies() {
  const ctx = useContext(CompaniesContext);
  if (!ctx) throw new Error("useCompanies must be used inside CompaniesProvider");
  return ctx;
}
