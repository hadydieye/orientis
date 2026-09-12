import Link from "next/link";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { PROFIL_LABEL } from "@/lib/labels";
import type { DetailProgram } from "@/lib/queries/institution-detail";

export function ProgramCard({ program }: { program: DetailProgram }) {
  return (
    <Link
      href={`/formations/${program.id}`}
      // Liste dense : pas de backdrop-blur ici.
      className="flex flex-col gap-2 rounded-button border border-glass-border bg-glass-1 p-4 outline-none transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-glass-border-hover focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="font-medium leading-snug">{program.name}</span>
      <span className="flex flex-wrap items-center gap-2">
        {program.profils.map((profil) => (
          <GlassBadge key={profil} variant="neutral">
            {/* Le sigle brut suffit sur une carte de liste ; le libellé
                complet est donné en title pour lever l'ambiguïté FA. */}
            <span title={PROFIL_LABEL[profil] ?? profil}>{profil}</span>
          </GlassBadge>
        ))}
        <span className="text-xs text-muted-dark">{program.code}</span>
      </span>
    </Link>
  );
}
