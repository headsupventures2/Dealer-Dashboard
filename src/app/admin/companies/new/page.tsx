"use client";

import { useRouter } from "next/navigation";
import { useCompanies } from "@/components/companies";
import { CompanyForm } from "@/components/company-form";
import { PageTitle } from "@/components/ui";
import { store } from "@/lib/store";

export default function NewCompanyPage() {
  const router = useRouter();
  const { refresh } = useCompanies();

  return (
    <>
      <PageTitle title="Add company" subtitle="Set up a new dealership or fleet partner" />
      <CompanyForm
        submitLabel="Create company"
        onSubmit={async (input) => {
          const c = await store.createCompany(input);
          await refresh();
          router.push(`/admin/companies/${c.id}`);
        }}
      />
    </>
  );
}
