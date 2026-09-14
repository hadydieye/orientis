import type { Metadata } from "next";
import { ConseillerChat } from "@/components/conseiller/ConseillerChat";

export const metadata: Metadata = {
  title: "Conseiller",
  description:
    "Pose tes questions d'orientation. Le conseiller répond à partir du catalogue officiel ParcourSup Guinée 2026.",
};

export default function ConseillerPage() {
  return (
    <main className="mx-auto flex h-[calc(100dvh-7rem)] w-full max-w-4xl flex-1 flex-col gap-4 px-4 pb-6 sm:px-6 sm:pb-8">
      <header className="animate-fade-in-up flex shrink-0 flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Conseiller d&apos;orientation
        </h1>
        <p className="text-sm text-muted">
          Réponses tirées uniquement du catalogue ParcourSup Guinée 2026. Les
          frais, conditions d&apos;admission et procédures d&apos;inscription
          n&apos;y figurent pas.
        </p>
      </header>

      <ConseillerChat />
    </main>
  );
}
