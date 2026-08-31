import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EntityForm } from "@/components/admin/EntityForm";
import { EMPTY_FEE, FEE_NUMERIC, feeFields } from "@/components/admin/forms/FeeFields";
import {
  getAcademicYearOptions, getProgramOptions, getSourceOptions,
} from "@/lib/queries/admin-catalog";

export const dynamic = "force-dynamic";

export default async function NewFeePage() {
  const [programs, years, sources] = await Promise.all([
    getProgramOptions(),
    getAcademicYearOptions(),
    getSourceOptions(),
  ]);

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
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Nouveaux frais</h1>
      </div>

      <EntityForm
        fields={feeFields(programs, years, sources)}
        initial={EMPTY_FEE}
        numericFields={FEE_NUMERIC}
        table="fees"
        backHref="/admin/frais"
      />
    </div>
  );
}
