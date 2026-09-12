import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EntityForm } from "@/components/admin/EntityForm";
import {
  EMPTY_PROGRAM, PROGRAM_NUMERIC, PROGRAM_RELATION_PATH, PROGRAM_RELATIONS,
  programFields,
} from "@/components/admin/forms/ProgramFields";
import { getInstitutionOptions } from "@/lib/queries/admin-catalog";

export const dynamic = "force-dynamic";

export default async function NewProgramPage() {
  const institutions = await getInstitutionOptions();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/formations"
          className="inline-flex items-center gap-1.5 rounded text-sm text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Formations
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Nouvelle formation</h1>
      </div>

      <EntityForm
        fields={programFields(institutions)}
        initial={EMPTY_PROGRAM}
        numericFields={PROGRAM_NUMERIC}
        relationFields={PROGRAM_RELATIONS}
        relationPath={PROGRAM_RELATION_PATH}
        table="programs"
        backHref="/admin/formations"
      />
    </div>
  );
}
