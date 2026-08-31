import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EntityForm } from "@/components/admin/EntityForm";
import {
  ADMISSION_NUMERIC, EMPTY_ADMISSION, admissionFields,
} from "@/components/admin/forms/AdmissionFields";
import {
  getAcademicYearOptions, getProgramOptions, getSourceOptions,
} from "@/lib/queries/admin-catalog";

export const dynamic = "force-dynamic";

export default async function NewAdmissionPage() {
  const [programs, years, sources] = await Promise.all([
    getProgramOptions(),
    getAcademicYearOptions(),
    getSourceOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/admissions"
          className="inline-flex items-center gap-1.5 rounded text-sm text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Conditions d&apos;admission
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          Nouvelle condition d&apos;admission
        </h1>
      </div>

      <EntityForm
        fields={admissionFields(programs, years, sources)}
        initial={EMPTY_ADMISSION}
        numericFields={ADMISSION_NUMERIC}
        table="admission_requirements"
        backHref="/admin/admissions"
      />
    </div>
  );
}
