import { Suspense } from "react";
import type { Metadata } from "next";
import { ProgramsCatalog } from "@/components/formations/ProgramsCatalog";
import { getCatalogPrograms } from "@/lib/queries/programs";

export const metadata: Metadata = {
  title: "Toutes les formations",
  description:
    "Les formations post-bac référencées en Guinée, filtrables par niveau, établissement et domaine.",
};

export const revalidate = 3600;

export default async function FormationsPage() {
  const { programs, domains, levels, institutions } = await getCatalogPrograms();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 pb-24 sm:px-6">
      <header className="animate-fade-in-up flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Toutes les formations
        </h1>
        <p className="max-w-xl text-muted">
          Les {programs.length} formations actuellement référencées, réparties
          dans {institutions.length} établissements.
        </p>
      </header>

      {/* Suspense obligatoire : ProgramsCatalog lit les search params, et une
          page prerendue qui les lit doit être sous une frontière Suspense —
          sinon le build de production échoue (le dev ne le signale pas). */}
      <Suspense
        fallback={<div className="h-64 rounded-panel border border-glass-border bg-glass-1" />}
      >
        <ProgramsCatalog
          programs={programs}
          domains={domains}
          levels={levels}
          institutions={institutions}
        />
      </Suspense>
    </main>
  );
}
