import { Suspense } from "react";
import type { Metadata } from "next";
import { ExplorerCatalog } from "@/components/explorer/ExplorerCatalog";
import { getCatalogInstitutions } from "@/lib/queries/institutions";

export const metadata: Metadata = {
  title: "Explorer les établissements — Orientis",
  description:
    "Tous les établissements d'enseignement supérieur référencés en Guinée.",
};

export const revalidate = 3600;

export default async function ExplorerPage() {
  const { institutions, cities } = await getCatalogInstitutions();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 pb-24 sm:px-6">
      <header className="animate-fade-in-up flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Explorer les établissements
        </h1>
        <p className="max-w-xl text-muted">
          Les {institutions.length} établissements d&apos;enseignement supérieur
          actuellement référencés, avec leurs formations.
        </p>
      </header>

      {/* Suspense obligatoire : ExplorerCatalog lit les search params, et une
          page prerendue qui les lit doit être sous une frontière Suspense —
          sinon le build de production échoue (le dev, lui, ne le signale pas). */}
      <Suspense
        fallback={
          <div className="h-64 rounded-panel border border-glass-border bg-glass-1" />
        }
      >
        <ExplorerCatalog institutions={institutions} cities={cities} />
      </Suspense>
    </main>
  );
}
