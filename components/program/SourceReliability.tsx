import { AlertTriangle, BadgeCheck } from "lucide-react";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { isOfficialSource } from "@/lib/labels";
import type { ProgramSource } from "@/lib/queries/program-detail";

/**
 * Mention accolée à CHAQUE valeur issue d'une source non officielle.
 * Règle de traçabilité du projet : aucun chiffre (seuil, frais) ne doit
 * s'afficher sans son niveau de fiabilité juste à côté.
 */
export function ReliabilityTag({ source }: { source: ProgramSource | null }) {
  if (!source) {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill border border-glass-border bg-glass-2 px-2 py-0.5 text-[11px] font-medium leading-none text-muted">
        <AlertTriangle className="h-3 w-3" aria-hidden />
        Source inconnue
      </span>
    );
  }

  const official = isOfficialSource(source);

  return (
    <span
      className={
        official
          ? "inline-flex items-center gap-1 rounded-pill border border-success/30 bg-success/15 px-2 py-0.5 text-[11px] font-medium leading-none text-success"
          : "inline-flex items-center gap-1 rounded-pill border border-warning/30 bg-warning/15 px-2 py-0.5 text-[11px] font-medium leading-none text-warning"
      }
      title={source.label}
    >
      {official ? (
        <BadgeCheck className="h-3 w-3" aria-hidden />
      ) : (
        <AlertTriangle className="h-3 w-3" aria-hidden />
      )}
      {official ? "Officiel · vérifié" : "Non-officiel, à vérifier"}
    </span>
  );
}

/** Variante pleine taille, pour la liste des sources en bas de page. */
export function ReliabilityBadge({ source }: { source: ProgramSource }) {
  const official = isOfficialSource(source);
  return (
    <GlassBadge
      variant={official ? "success" : "warning"}
      className="w-fit shrink-0"
    >
      {official ? "Officiel · vérifié" : "Non-officiel, à vérifier"}
    </GlassBadge>
  );
}
