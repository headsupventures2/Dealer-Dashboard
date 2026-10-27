import type { Company, CompanyInput, Profile } from "../types";
import type { Store } from "./types";

// Browser-only store used when Supabase isn't configured, so the app can be
// clicked through locally. Not secure — passwords live in localStorage.

interface PreviewUser extends Profile {
  password: string;
}

interface PreviewDb {
  users: PreviewUser[];
  companies: Company[];
  sessionUserId: string | null;
}

const KEY = "led-preview-v1";

export const PREVIEW_ADMIN = { email: "admin@leadingedge.test", password: "leadingedge" };

function seed(): PreviewDb {
  return {
    users: [{ id: "admin-1", role: "admin", company_id: null, ...PREVIEW_ADMIN }],
    companies: [],
    sessionUserId: null,
  };
}

function load(): PreviewDb {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as PreviewDb;
  } catch {}
  const db = seed();
  save(db);
  return db;
}

function save(db: PreviewDb) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {}
}

function toProfile(u: PreviewUser): Profile {
  return { id: u.id, email: u.email, role: u.role, company_id: u.company_id };
}

function requireAdmin(db: PreviewDb) {
  const me = db.users.find((u) => u.id === db.sessionUserId);
  if (me?.role !== "admin") throw new Error("Admins only");
}

export const previewStore: Store = {
  mode: "preview",

  async currentProfile() {
    const db = load();
    const me = db.users.find((u) => u.id === db.sessionUserId);
    return me ? toProfile(me) : null;
  },

  async signIn(email, password) {
    const db = load();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) throw new Error("Invalid email or password");
    db.sessionUserId = user.id;
    save(db);
    return toProfile(user);
  },

  async signOut() {
    const db = load();
    db.sessionUserId = null;
    save(db);
  },

  async listCompanies() {
    const db = load();
    const me = db.users.find((u) => u.id === db.sessionUserId);
    const all = [...db.companies].sort((a, b) => a.name.localeCompare(b.name));
    return me?.role === "admin" ? all : all.filter((c) => c.id === me?.company_id);
  },

  async getCompany(id) {
    return (await this.listCompanies()).find((c) => c.id === id) ?? null;
  },

  async createCompany(input) {
    const db = load();
    requireAdmin(db);
    const company: Company = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    db.companies.push(company);
    save(db);
    return company;
  },

  async updateCompany(id, input: CompanyInput) {
    const db = load();
    requireAdmin(db);
    const i = db.companies.findIndex((c) => c.id === id);
    if (i < 0) throw new Error("Company not found");
    db.companies[i] = { ...db.companies[i], ...input };
    save(db);
    return db.companies[i];
  },

  async listCompanyUsers(companyId) {
    const db = load();
    requireAdmin(db);
    return db.users.filter((u) => u.company_id === companyId).map(toProfile);
  },

  async createClientUser(companyId, email, password) {
    const db = load();
    requireAdmin(db);
    const clean = email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === clean)) throw new Error("That email already has a login");
    const user: PreviewUser = { id: crypto.randomUUID(), email: clean, password, role: "client", company_id: companyId };
    db.users.push(user);
    save(db);
    return toProfile(user);
  },
};
