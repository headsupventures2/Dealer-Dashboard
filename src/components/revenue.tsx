import { Card } from "@/components/ui";
import { money } from "@/lib/format";
import type { RevenueSummary } from "@/lib/revenue";

export function MoneyTile({
  label,
  value,
  sub,
  accent = false,
  className = "",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <p className="text-sm font-medium text-navy/60">{label}</p>
      <p className={`mt-1 font-brand text-2xl font-bold sm:text-3xl ${accent ? "text-maroon" : ""}`}>{value}</p>
      {sub && <p className="mt-1 text-sm text-navy/55">{sub}</p>}
    </Card>
  );
}

/** Profit only counts jobs with a cost set; say so when that's not all of them. */
export function profitSub(s: RevenueSummary) {
  if (s.jobs === 0) return undefined;
  if (s.jobsWithCost === 0) return "Set costs on the company to track profit";
  if (s.jobsWithCost < s.jobs) return `Based on ${s.jobsWithCost} of ${s.jobs} jobs with a cost set`;
  return undefined;
}

export function FuelLine({ s }: { s: RevenueSummary }) {
  if (s.fuelBilled === 0) return null;
  return (
    <p className="mt-3 text-sm text-navy/60">
      Fuel billed through: <span className="font-semibold text-navy">{money(s.fuelBilled)}</span>
      <span className="text-navy/45"> · not included in revenue or profit</span>
    </p>
  );
}
