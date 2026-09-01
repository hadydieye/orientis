import { AlertTriangle, BadgeCheck } from "lucide-react";
import { RELIABILITY_LABEL, isOfficialSource } from "@/lib/labels";

/**
 * Fiabilité d'une source dans les tableaux du back-office.
 *
 * Même règle et MÊME VOCABULAIRE que sur le site public : les libellés
 * viennent de RELIABILITY_LABEL, le verdict de isOfficialSource(). Cette
 * variante existe uniquement pour la densité des tableaux du back-office —
 * elle ne redéfinit ni le texte ni la règle.
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
        {RELIABILITY_LABEL.unknown}
      </span>
    );
  }
  const official = isOfficialSource(source);
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
      {official ? RELIABILITY_LABEL.official : RELIABILITY_LABEL.unofficial}
    </span>
  );
}
