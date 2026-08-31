import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EntityForm } from "@/components/admin/EntityForm";
import {
  EMPTY_PROGRAM, PROGRAM_NUMERIC, programFields,
} from "@/components/admin/forms/ProgramFields";
import { getDepartmentOptions } from "@/lib/queries/admin-catalog";

export const dynamic = "force-dynamic";

export default async function NewProgramPage() {
  const departments = await getDepartmentOptions();

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
        fields={programFields(departments)}
        initial={EMPTY_PROGRAM}
        numericFields={PROGRAM_NUMERIC}
        table="programs"
        backHref="/admin/formations"
      />
    </div>
  );
}
