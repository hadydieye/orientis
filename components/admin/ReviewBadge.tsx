import { cn } from "@/lib/cn";
import { reviewStatusLabel } from "@/lib/labels";

const MAP: Record<string, string> = {
  approved: "border-success/30 bg-success/15 text-success",
  pending: "border-warning/30 bg-warning/15 text-warning",
  rejected: "border-error/30 bg-error/15 text-error",
};

/**
 * État de modération d'une ligne.
 *
 * `short` (défaut) pour les cellules de tableau, forme longue pour les
 * en-têtes de fiche où la place ne manque pas. Le libellé vient de
 * lib/labels.ts : aucune valeur brute de la base ne doit atteindre l'écran.
 */
export function ReviewBadge({
  status,
  short = true,
  className,
}: {
  status: string;
  short?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-pill border px-2 py-0.5 text-xs font-medium",
        MAP[status] ?? "border-glass-border bg-glass-2 text-muted",
        className
      )}
    >
      {reviewStatusLabel(status, short)}
    </span>
  );
}
