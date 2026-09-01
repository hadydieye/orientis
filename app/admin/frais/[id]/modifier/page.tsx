import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EntityForm } from "@/components/admin/EntityForm";
import { ReviewBadge } from "@/components/admin/ReviewBadge";
import { FEE_NUMERIC, feeFields } from "@/components/admin/forms/FeeFields";
import {
  getAcademicYearOptions, getAdminRow, getProgramOptions, getSourceOptions,
} from "@/lib/queries/admin-catalog";
import { FEE_TYPE_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export default async function EditFeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row, programs, years, sources] = await Promise.all([
    getAdminRow("fees", id),
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
          href="/admin/frais"
          className="inline-flex items-center gap-1.5 rounded text-sm text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Frais
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          {programLabel} — {FEE_TYPE_LABEL[row.fee_type] ?? row.fee_type}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Statut de validation <ReviewBadge status={row.review_status} short={false} className="ml-1 align-middle" />
        </p>
      </div>

      <EntityForm
        fields={feeFields(programs, years, sources)}
        initial={{
          program_id: str(row.program_id),
          academic_year_id: str(row.academic_year_id),
          fee_type: str(row.fee_type),
          frequency: str(row.frequency),
          amount: str(row.amount),
          currency: str(row.currency),
          source_id: str(row.source_id),
          conditions: str(row.conditions),
        }}
        numericFields={FEE_NUMERIC}
        table="fees"
        rowId={id}
        backHref="/admin/frais"
      />
    </div>
  );
}
