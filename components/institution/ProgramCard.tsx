import Link from "next/link";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { LEVEL_LABEL } from "@/lib/labels";
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
        <GlassBadge variant="neutral">
          {LEVEL_LABEL[program.level] ?? program.level}
        </GlassBadge>
        {/* Durée absente pour certaines formations : on n'affiche rien
            plutôt qu'un "?" trompeur. */}
        {program.durationYears !== null && (
          <span className="text-xs text-muted">
            {program.durationYears} an{program.durationYears > 1 ? "s" : ""}
          </span>
        )}
      </span>
    </Link>
  );
}
