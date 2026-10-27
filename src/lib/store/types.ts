import type { Company, CompanyInput, Job, JobPatch, Profile, RequestInput } from "../types";

/** One interface, two backends: Supabase (live) and the in-browser preview store. */
export interface Store {
  mode: "supabase" | "preview";
  currentProfile(): Promise<Profile | null>;
  signIn(email: string, password: string): Promise<Profile>;
  signOut(): Promise<void>;

  listCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | null>;
  createCompany(input: CompanyInput): Promise<Company>;
  updateCompany(id: string, input: CompanyInput): Promise<Company>;

  listCompanyUsers(companyId: string): Promise<Profile[]>;
  createClientUser(companyId: string, email: string, password: string): Promise<Profile>;

  /** Admins get every job (or one company's); clients only ever get their own company's. */
  listJobs(companyId?: string): Promise<Job[]>;
  createRequest(companyId: string, input: RequestInput): Promise<Job>;
  updateJob(id: string, patch: JobPatch): Promise<Job>;
}
