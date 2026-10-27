"use client";

import { useEffect, useState } from "react";
import { FuelLine, MoneyTile, profitSub } from "@/components/revenue";
import { money } from "@/lib/format";
import { completedIn, monthLabel, summarize, thisMonth } from "@/lib/revenue";
import { store } from "@/lib/store";
import type { Job } from "@/lib/types";

export function CompanyRevenue({ companyId }: { companyId: string }) {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    store.listJobs(companyId).then(setJobs);
  }, [companyId]);

  const all = summarize(completedIn(jobs));
  const month = summarize(completedIn(jobs, thisMonth()));

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">Revenue</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <MoneyTile label="Jobs completed" value={String(all.jobs)} sub={`${month.jobs} this month`} />
        <MoneyTile label="This month" value={money(month.revenue)} sub={monthLabel(thisMonth())} accent />
        <MoneyTile label="All-time revenue" value={money(all.revenue)} />
        <MoneyTile label="All-time profit" value={all.jobsWithCost ? money(all.profit) : "—"} sub={profitSub(all)} />
      </div>
      <FuelLine s={all} />
    </section>
  );
}
