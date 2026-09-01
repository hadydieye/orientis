import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EntityForm } from "@/components/admin/EntityForm";
import { ReviewBadge } from "@/components/admin/ReviewBadge";
import { departmentFields } from "@/components/admin/forms/DepartmentFields";
import { getAcademicUnitOptions, getAdminRow } from "@/lib/queries/admin-catalog";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row, units] = await Promise.all([
    getAdminRow("departments", id),
    getAcademicUnitOptions(),
  ]);
  if (!row) notFound();

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
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{row.name}</h1>
        <p className="mt-1 text-sm text-muted">
          Statut de validation <ReviewBadge status={row.review_status} short={false} className="ml-1 align-middle" />
        </p>
      </div>

      <EntityForm
        fields={departmentFields(units)}
        initial={{
          academic_unit_id: str(row.academic_unit_id),
          name: str(row.name),
          contact: str(row.contact),
          description: str(row.description),
        }}
        table="departments"
        rowId={id}
        backHref="/admin/departements"
      />
    </div>
  );
}
