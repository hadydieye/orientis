import Link from "next/link";
import { Building2 } from "lucide-react";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import type { CatalogProgram } from "@/lib/queries/programs";

export function ProgramListCard({ program }: { program: CatalogProgram }) {
  return (
    <Link
      href={`/formations/${program.id}`}
      className="block rounded-card outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* blur={false} : grille dense (jusqu'à 200 cartes), backdrop-filter
          réservé à la navbar / au hero / aux modales. */}
      <GlassCard variant="2" blur={false} className="flex h-full flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {program.typeDiplome && (
            <GlassBadge variant="neutral">{program.typeDiplome}</GlassBadge>
          )}
        </div>

        <h2 className="font-semibold leading-snug">{program.name}</h2>

        <div className="mt-auto flex flex-col gap-1.5 pt-2 text-sm text-muted">
          {program.institutions.length === 0 ? (
            // Les 2 cycles préparatoires ne sont rattachés à aucun
            // établissement dans la source : le dire vaut mieux qu'une ligne
            // vide qu'on prendrait pour un bug d'affichage.
            <span className="text-xs text-muted-dark">
              Aucun établissement rattaché
            </span>
          ) : (
            <span className="flex items-start gap-1.5">
              <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="flex flex-wrap gap-1.5 leading-snug">
                {program.institutions.map((institution) => (
                  <span
                    key={institution.id}
                    // Le sigle suffit sur une carte ; le nom complet reste
                    // accessible au survol et aux lecteurs d'écran.
                    title={institution.name}
                    className="rounded-pill border border-glass-border bg-glass-1 px-2 py-0.5 text-xs"
                  >
                    {institution.sigle ?? institution.name}
                  </span>
                ))}
              </span>
            </span>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}
