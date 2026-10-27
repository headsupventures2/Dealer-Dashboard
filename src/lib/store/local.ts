import { lockPrice, type Company, type CompanyInput, type Job, type Photo, type PhotoType, type Profile } from "../types";
import type { Store } from "./types";

// Browser-only store: backs preview mode (no Supabase keys) and the sales demo.
// Not secure — passwords live in localStorage.

export interface LocalUser extends Profile {
  password: string;
}

export interface LocalDb {
  users: LocalUser[];
  companies: Company[];
  jobs: Job[];
  internalNotes: Record<string, string>;
  sessionUserId: string | null;
}

// Photos are too big for localStorage, so they go in IndexedDB.
export interface StoredPhoto {
  id: string;
  job_id: string;
  type: PhotoType;
  blob: Blob;
  created_at: string;
}

interface Options {
  mode: Store["mode"];
  key: string; // localStorage key for the data
  photoDb: string; // IndexedDB name for photos
  seed(): LocalDb;
}

export function createLocalStore(opts: Options) {
  function load(): LocalDb {
    try {
      const raw = localStorage.getItem(opts.key);
      if (raw) return { jobs: [], internalNotes: {}, ...JSON.parse(raw) } as LocalDb;
    } catch {}
    const db = opts.seed();
    save(db);
    return db;
  }

  function save(db: LocalDb) {
    try {
      localStorage.setItem(opts.key, JSON.stringify(db));
    } catch {}
  }

  function photoDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(opts.photoDb, 1);
      req.onupgradeneeded = () => req.result.createObjectStore("photos", { keyPath: "id" }).createIndex("job_id", "job_id");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function photoTx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
    const db = await photoDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("photos", mode);
      const req = run(tx.objectStore("photos"));
      tx.oncomplete = () => resolve(req ? req.result : (undefined as T));
      tx.onerror = () => reject(tx.error);
    });
  }

  const objectUrls = new Map<string, string>();

  function toPhoto(p: StoredPhoto): Photo {
    if (!objectUrls.has(p.id)) objectUrls.set(p.id, URL.createObjectURL(p.blob));
    return { id: p.id, job_id: p.job_id, type: p.type, url: objectUrls.get(p.id)!, created_at: p.created_at };
  }

  function toProfile(u: LocalUser): Profile {
    return { id: u.id, email: u.email, role: u.role, company_id: u.company_id };
  }

  function me(db: LocalDb) {
    return db.users.find((u) => u.id === db.sessionUserId);
  }

  function requireAdmin(db: LocalDb) {
    if (me(db)?.role !== "admin") throw new Error("Admins only");
  }

  const store: Store = {
    mode: opts.mode,

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
      const user: LocalUser = { id: crypto.randomUUID(), email: clean, password, role: "client", company_id: companyId };
      db.users.push(user);
      save(db);
      return toProfile(user);
    },

    async listJobs(companyId) {
      const db = load();
      const user = me(db);
      if (!user) return [];
      const scope = user.role === "admin" ? companyId : user.company_id;
      return db.jobs
        .filter((j) => !scope || j.company_id === scope)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },

    async createRequest(companyId, input) {
      const db = load();
      const user = me(db);
      if (!user) throw new Error("Not signed in");
      const job: Job = {
        ...input,
        id: crypto.randomUUID(),
        company_id: user.role === "admin" ? companyId : user.company_id!,
        status: "new",
        scheduled_at: null,
        completed_at: null,
        price_at_completion: null,
        cost_at_completion: null,
        fuel_gallons: null,
        fuel_amount: null,
        client_notes: null,
        created_at: new Date().toISOString(),
      };
      db.jobs.push(job);
      save(db);
      return job;
    },

    async getJob(id) {
      return (await this.listJobs()).find((j) => j.id === id) ?? null;
    },

    async updateJob(id, patch) {
      const db = load();
      requireAdmin(db);
      const i = db.jobs.findIndex((j) => j.id === id);
      if (i < 0) throw new Error("Job not found");
      const prev = db.jobs[i];
      let next: Job = { ...prev, ...patch };
      if (next.status === "completed" && prev.status !== "completed") {
        const company = db.companies.find((c) => c.id === next.company_id)!;
        next = { ...next, completed_at: next.completed_at ?? new Date().toISOString() };
        if (next.price_at_completion == null) next = { ...next, ...lockPrice(next, company) };
      }
      db.jobs[i] = next;
      save(db);
      return next;
    },

    async getInternalNotes(jobId) {
      const db = load();
      requireAdmin(db);
      return db.internalNotes[jobId] ?? "";
    },

    async setInternalNotes(jobId, notes) {
      const db = load();
      requireAdmin(db);
      db.internalNotes[jobId] = notes;
      save(db);
    },

    async listPhotos(jobId) {
      if (!(await this.getJob(jobId))) return [];
      const rows = await photoTx<StoredPhoto[]>("readonly", (s) => s.index("job_id").getAll(jobId));
      return rows.sort((a, b) => a.created_at.localeCompare(b.created_at)).map(toPhoto);
    },

    async uploadPhotos(job, type, images) {
      requireAdmin(load());
      const rows: StoredPhoto[] = images.map((blob) => ({
        id: crypto.randomUUID(),
        job_id: job.id,
        type,
        blob,
        created_at: new Date().toISOString(),
      }));
      await photoTx("readwrite", (s) => void rows.forEach((r) => s.put(r)));
      return rows.map(toPhoto);
    },

    async deletePhoto(photoId) {
      requireAdmin(load());
      await photoTx("readwrite", (s) => s.delete(photoId));
      const url = objectUrls.get(photoId);
      if (url) URL.revokeObjectURL(url);
      objectUrls.delete(photoId);
    },
  };

  /** Replaces all data and photos (used to load a fresh demo). */
  async function reset(db: LocalDb, photos: StoredPhoto[]) {
    save(db);
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.clear();
    await photoTx("readwrite", (s) => {
      s.clear();
      photos.forEach((p) => s.put(p));
    });
  }

  return { store, reset };
}
