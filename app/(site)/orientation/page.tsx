import type { Metadata } from "next";
import { OrientationFlow } from "@/components/orientation/OrientationFlow";
import { getCatalogInstitutions } from "@/lib/queries/institutions";

export const metadata: Metadata = {
  title: "Trouver ma voie — Orientis",
  description:
    "Réponds à deux questions et découvre les formations qui correspondent à ton profil.",
};

export const revalidate = 3600;

export default async function OrientationPage() {
  // Villes réelles, pour l'étape facultative d'affinage du profil.
  const { cities } = await getCatalogInstitutions();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 pb-24 sm:px-6">
      <header className="animate-fade-in-up flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Trouver ma voie
        </h1>
        <p className="mx-auto max-w-xl text-muted">
          Deux questions suffisent pour voir les formations compatibles avec ton
          profil. Aucun compte n&apos;est nécessaire.
        </p>
      </header>

      <OrientationFlow cities={cities} />
    </main>
  );
}
