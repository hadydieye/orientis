import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EntityForm } from "@/components/admin/EntityForm";
import { ADMISSION_NUMERIC, admissionFields } from "@/components/admin/forms/AdmissionFields";
import {
  getAcademicYearOptions, getAdminRow, getProgramOptions, getSourceOptions,
} from "@/lib/queries/admin-catalog";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export default async function EditAdmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row, programs, years, sources] = await Promise.all([
    getAdminRow("admission_requirements", id),
    getProgramOptions(),
    getAcademicYearOptions(),
    getSourceOptions(),
  ]);
  if (!row) notFound();

  const programLabel =
    programs.find((p) => p.value === row.program_id)?.label ?? "Formation";

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
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{programLabel}</h1>
        <p className="mt-1 text-sm text-muted">
          Statut de validation : <strong>{row.review_status}</strong>
        </p>
      </div>

      <EntityForm
        fields={admissionFields(programs, years, sources)}
        initial={{
          program_id: str(row.program_id),
          academic_year_id: str(row.academic_year_id),
          accepted_series: row.accepted_series ?? [],
          min_average: str(row.min_average),
          age_limit: str(row.age_limit),
          source_id: str(row.source_id),
          other_conditions: str(row.other_conditions),
        }}
        numericFields={ADMISSION_NUMERIC}
        table="admission_requirements"
        rowId={id}
        backHref="/admin/admissions"
      />
    </div>
  );
}
