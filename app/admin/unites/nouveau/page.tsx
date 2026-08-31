import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EntityForm } from "@/components/admin/EntityForm";
import {
  EMPTY_ACADEMIC_UNIT, academicUnitFields,
} from "@/components/admin/forms/AcademicUnitFields";
import { getInstitutionOptions } from "@/lib/queries/admin-catalog";

export const dynamic = "force-dynamic";

export default async function NewAcademicUnitPage() {
  const institutions = await getInstitutionOptions();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/unites"
          className="inline-flex items-center gap-1.5 rounded text-sm text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Unités académiques
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Nouvelle unité académique</h1>
      </div>

      <EntityForm
        fields={academicUnitFields(institutions)}
        initial={EMPTY_ACADEMIC_UNIT}
        table="academic_units"
        backHref="/admin/unites"
      />
    </div>
  );
}
