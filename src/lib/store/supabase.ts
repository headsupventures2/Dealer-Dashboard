import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Company, Profile } from "../types";
import type { Store } from "./types";

let client: SupabaseClient | null = null;

export function supabase() {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return client;
}

const NUMERIC: (keyof Company)[] = [
  "price_per_vehicle",
  "cost_per_vehicle",
  "lot_rinse_price",
  "lot_rinse_cost",
  "fuel_fill_price",
  "fuel_fill_cost",
];

// Postgres numeric columns come back as strings; normalise to numbers.
function toCompany(row: Record<string, unknown>): Company {
  const c = { ...row } as Record<string, unknown>;
  for (const k of NUMERIC) c[k] = c[k] == null ? null : Number(c[k]);
  return c as unknown as Company;
}

async function profileFor(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase().from("profiles").select("id,email,role,company_id").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export const supabaseStore: Store = {
  mode: "supabase",

  async currentProfile() {
    const { data } = await supabase().auth.getSession();
    return data.session ? profileFor(data.session.user.id) : null;
  },

  async signIn(email, password) {
    const { data, error } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(error.message);
    const profile = await profileFor(data.user.id);
    if (!profile) {
      await supabase().auth.signOut();
      throw new Error("This login isn't linked to an account yet. Contact Leading Edge Detailing.");
    }
    return profile;
  },

  async signOut() {
    await supabase().auth.signOut();
  },

  async listCompanies() {
    const { data, error } = await supabase().from("companies").select("*").order("name");
    if (error) throw error;
    return data.map(toCompany);
  },

  async getCompany(id) {
    const { data, error } = await supabase().from("companies").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toCompany(data) : null;
  },

  async createCompany(input) {
    const { data, error } = await supabase().from("companies").insert(input).select().single();
    if (error) throw error;
    return toCompany(data);
  },

  async updateCompany(id, input) {
    const { data, error } = await supabase().from("companies").update(input).eq("id", id).select().single();
    if (error) throw error;
    return toCompany(data);
  },

  async listCompanyUsers(companyId) {
    const { data, error } = await supabase()
      .from("profiles")
      .select("id,email,role,company_id")
      .eq("company_id", companyId)
      .order("email");
    if (error) throw error;
    return data as Profile[];
  },

  async createClientUser(companyId, email, password) {
    // Creating auth users needs the service-role key, so this goes through our API route.
    const { data } = await supabase().auth.getSession();
    const res = await fetch("/api/admin/client-users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
      body: JSON.stringify({ companyId, email, password }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Could not create login");
    return body.profile as Profile;
  },
};
