import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EntityForm } from "@/components/admin/EntityForm";
import { ReviewBadge } from "@/components/admin/ReviewBadge";
import { PROGRAM_NUMERIC, programFields } from "@/components/admin/forms/ProgramFields";
import { getAdminRow, getDepartmentOptions } from "@/lib/queries/admin-catalog";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row, departments] = await Promise.all([
    getAdminRow("programs", id),
    getDepartmentOptions(),
  ]);
  if (!row) notFound();

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
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{row.name}</h1>
        <p className="mt-1 text-sm text-muted">
          Statut de validation <ReviewBadge status={row.review_status} short={false} className="ml-1 align-middle" />
        </p>
      </div>

      <EntityForm
        fields={programFields(departments)}
        initial={{
          department_id: str(row.department_id),
          name: str(row.name),
          code: str(row.code),
          level: str(row.level),
          domain: str(row.domain),
          specialty: str(row.specialty),
          duration_years: str(row.duration_years),
          degree_awarded: str(row.degree_awarded),
          language: str(row.language),
          description: str(row.description),
          curriculum: str(row.curriculum),
          career_prospects: str(row.career_prospects),
          further_studies: str(row.further_studies),
        }}
        numericFields={PROGRAM_NUMERIC}
        table="programs"
        rowId={id}
        backHref="/admin/formations"
      />
    </div>
  );
}
