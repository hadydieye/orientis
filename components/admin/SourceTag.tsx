import { AlertTriangle, BadgeCheck } from "lucide-react";

/**
 * Fiabilité d'une source dans les tableaux du back-office.
 *
 * Même règle que sur le site public : une source ne fait autorité que si elle
 * est officielle ET vérifiée. Tout le reste porte la mention « à vérifier »,
 * y compris ici — un chiffre ne s'affiche jamais sans son contexte.
 */
export function SourceTag({
  source,
}: {
  source: { label: string; sourceType: string; status: string } | null;
}) {
  if (!source) {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill border border-glass-border bg-glass-2 px-2 py-0.5 text-[11px] font-medium leading-none text-muted">
        <AlertTriangle className="h-3 w-3" aria-hidden />
        Source inconnue
      </span>
    );
  }
  const official = source.sourceType === "officiel" && source.status === "verifie";
  return (
    <span
      title={`${source.label} (${source.sourceType}/${source.status})`}
      className={
        official
          ? "inline-flex items-center gap-1 rounded-pill border border-success/30 bg-success/15 px-2 py-0.5 text-[11px] font-medium leading-none text-success"
          : "inline-flex items-center gap-1 rounded-pill border border-warning/30 bg-warning/15 px-2 py-0.5 text-[11px] font-medium leading-none text-warning"
      }
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
