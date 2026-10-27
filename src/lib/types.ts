export type Role = "admin" | "client";

export type ServiceType = "detail" | "lot_rinse" | "fuel_fill";

export const SERVICES: { type: ServiceType; label: string; priceKey: RateKey; costKey: RateKey }[] = [
  { type: "detail", label: "Detail", priceKey: "price_per_vehicle", costKey: "cost_per_vehicle" },
  { type: "lot_rinse", label: "Lot Rinse", priceKey: "lot_rinse_price", costKey: "lot_rinse_cost" },
  { type: "fuel_fill", label: "Fuel Fill-Up", priceKey: "fuel_fill_price", costKey: "fuel_fill_cost" },
];

export type RateKey =
  | "price_per_vehicle"
  | "cost_per_vehicle"
  | "lot_rinse_price"
  | "lot_rinse_cost"
  | "fuel_fill_price"
  | "fuel_fill_cost";

export interface Company {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  price_per_vehicle: number;
  cost_per_vehicle: number | null;
  lot_rinse_price: number;
  lot_rinse_cost: number | null;
  fuel_fill_price: number;
  fuel_fill_cost: number | null;
  created_at: string;
}

export type CompanyInput = Omit<Company, "id" | "created_at">;

export interface Profile {
  id: string;
  email: string;
  role: Role;
  company_id: string | null;
}

export type JobStatus = "new" | "scheduled" | "in_progress" | "completed";

export const STATUSES: { value: JobStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
}

/** Items a service manager can request on a detail. */
export const DETAIL_CHECKLIST: { key: string; label: string }[] = [
  { key: "bugs", label: "Bugs / bug removal" },
  { key: "engine_bay", label: "Engine bay" },
  { key: "interior", label: "Interior deep clean" },
  { key: "exterior", label: "Exterior wash and decon" },
];

export interface Job {
  id: string;
  company_id: string;
  service_type: ServiceType;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  stock_or_vin: string | null;
  vehicle_count: number;
  lot_area: string | null;
  request_notes: string | null;
  checklist: ChecklistItem[];
  preferred_date: string | null; // YYYY-MM-DD
  status: JobStatus;
  scheduled_at: string | null;
  completed_at: string | null;
  price_at_completion: number | null;
  cost_at_completion: number | null;
  fuel_gallons: number | null;
  fuel_amount: number | null;
  client_notes: string | null;
  created_at: string;
}

export type RequestInput = Pick<
  Job,
  | "service_type"
  | "vehicle_year"
  | "vehicle_make"
  | "vehicle_model"
  | "vehicle_color"
  | "stock_or_vin"
  | "vehicle_count"
  | "lot_area"
  | "request_notes"
  | "checklist"
  | "preferred_date"
>;

export type JobPatch = Partial<Pick<Job, "status" | "scheduled_at">>;

export function serviceLabel(type: ServiceType) {
  return SERVICES.find((s) => s.type === type)?.label ?? type;
}

/** One-line description of what the job is, for lists. */
export function jobTitle(job: Job) {
  if (job.service_type === "lot_rinse") {
    return `Lot rinse · ${job.vehicle_count} vehicle${job.vehicle_count === 1 ? "" : "s"}${job.lot_area ? ` · ${job.lot_area}` : ""}`;
  }
  const vehicle = [job.vehicle_year, job.vehicle_make, job.vehicle_model].filter(Boolean).join(" ");
  return vehicle || job.stock_or_vin || "Vehicle";
}

/** Locks the company's current per-vehicle rate onto a job as it completes. Mirrors the jobs_guard DB trigger. */
export function lockPrice(job: Job, company: Company): Pick<Job, "price_at_completion" | "cost_at_completion"> {
  const svc = SERVICES.find((s) => s.type === job.service_type)!;
  const cost = company[svc.costKey];
  return {
    price_at_completion: job.vehicle_count * (company[svc.priceKey] ?? 0),
    cost_at_completion: cost == null ? null : job.vehicle_count * cost,
  };
}
