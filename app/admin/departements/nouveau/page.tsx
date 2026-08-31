import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EntityForm } from "@/components/admin/EntityForm";
import { EMPTY_DEPARTMENT, departmentFields } from "@/components/admin/forms/DepartmentFields";
import { getAcademicUnitOptions } from "@/lib/queries/admin-catalog";

export const dynamic = "force-dynamic";

export default async function NewDepartmentPage() {
  const units = await getAcademicUnitOptions();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/departements"
          className="inline-flex items-center gap-1.5 rounded text-sm text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Départements
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Nouveau département</h1>
      </div>

      <EntityForm
        fields={departmentFields(units)}
        initial={EMPTY_DEPARTMENT}
        table="departments"
        backHref="/admin/departements"
      />
    </div>
  );
}
