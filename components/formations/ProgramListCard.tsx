import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { LEVEL_LABEL } from "@/lib/labels";
import { hasLimitedInfo } from "@/lib/programs/completeness";
import { LimitedInfoBadge } from "@/components/program/LimitedInfoBadge";
import type { CatalogProgram } from "@/lib/queries/programs";

export function ProgramListCard({ program }: { program: CatalogProgram }) {
  const limited = hasLimitedInfo(program);

  return (
    <Link
      href={`/formations/${program.id}`}
      className="block rounded-card outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* blur={false} : grille dense (jusqu'à 108 cartes), backdrop-filter
          réservé à la navbar / au hero / aux modales. */}
      <GlassCard variant="2" blur={false} className="flex h-full flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <GlassBadge variant="neutral">
            {LEVEL_LABEL[program.level] ?? program.level}
          </GlassBadge>
          {program.durationYears !== null && (
            <span className="text-xs text-muted">
              {program.durationYears} an{program.durationYears > 1 ? "s" : ""}
            </span>
          )}
          {program.domain && (
            <GlassBadge variant="neutral">{program.domain}</GlassBadge>
          )}
          {limited && <LimitedInfoBadge />}
        </div>

        <h2 className="font-semibold leading-snug">{program.name}</h2>

        {program.specialty && (
          <p className="text-sm leading-relaxed text-muted">{program.specialty}</p>
        )}

        <div className="mt-auto flex flex-col gap-1.5 pt-2 text-sm text-muted">
          <span className="flex items-start gap-1.5">
            <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="leading-snug">{program.institutionName}</span>
          </span>
          {program.city && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {program.city}
            </span>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}
