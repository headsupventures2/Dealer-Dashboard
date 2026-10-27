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
