import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EntityForm } from "@/components/admin/EntityForm";
import { academicUnitFields } from "@/components/admin/forms/AcademicUnitFields";
import { getAdminRow, getInstitutionOptions } from "@/lib/queries/admin-catalog";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export default async function EditAcademicUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row, institutions] = await Promise.all([
    getAdminRow("academic_units", id),
    getInstitutionOptions(),
  ]);
  if (!row) notFound();

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
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{row.name}</h1>
        <p className="mt-1 text-sm text-muted">
          Statut de validation : <strong>{row.review_status}</strong>
        </p>
      </div>

      <EntityForm
        fields={academicUnitFields(institutions)}
        initial={{
          institution_id: str(row.institution_id),
          name: str(row.name),
          type: str(row.type),
          contact: str(row.contact),
          address: str(row.address),
          website: str(row.website),
          description: str(row.description),
        }}
        table="academic_units"
        rowId={id}
        backHref="/admin/unites"
      />
    </div>
  );
}
