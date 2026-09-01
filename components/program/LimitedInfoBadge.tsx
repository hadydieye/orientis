import { FileQuestion } from "lucide-react";
import { LIMITED_INFO_BADGE } from "@/lib/programs/completeness";

/**
 * Marque discrète apposée sur une formation sans contenu rédactionnel.
 *
 * Volontairement neutre, ni succès ni erreur : ce n'est pas un défaut de la
 * formation, c'est un état de notre catalogue. Le `title` explicite la raison
 * pour qui survole, sans alourdir la carte.
 */
export function LimitedInfoBadge({ className }: { className?: string }) {
  return (
    <span
      title="Ni présentation, ni contenu de programme, ni débouchés ne sont encore renseignés pour cette formation."
      className={[
        "inline-flex items-center gap-1 rounded-pill border border-glass-border bg-glass-2 px-2 py-0.5 text-[11px] font-medium leading-none text-muted",
        className ?? "",
      ].join(" ")}
    >
      <FileQuestion className="h-3 w-3 shrink-0" aria-hidden />
      {LIMITED_INFO_BADGE}
    </span>
  );
}
