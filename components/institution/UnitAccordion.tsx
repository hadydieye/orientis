import { ChevronRight } from "lucide-react";
import type { DetailUnit } from "@/lib/queries/institution-detail";

const UNIT_TYPE_LABEL: Record<string, string> = {
  faculte: "Faculté",
  institut: "Institut",
  centre: "Centre",
};

/**
 * Accordéon en <details>/<summary> natif : aucun JS, aucune hydratation,
 * et le contenu reste accessible au clavier et à la recherche du navigateur.
 * Chaque département renvoie vers son groupe dans la section Formations.
 */
export function UnitAccordion({ units }: { units: DetailUnit[] }) {
  return (
    <div className="flex flex-col gap-3">
      {units.map((unit, index) => (
        <details
          key={unit.id}
          // La première unité est ouverte : la section ne paraît pas vide.
          open={index === 0}
          className="group rounded-card border border-glass-border bg-glass-1"
        >
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
            <ChevronRight
              className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 ease-out group-open:rotate-90"
              aria-hidden
            />
            <span className="flex-1 font-medium leading-snug">{unit.name}</span>
            <span className="shrink-0 text-xs text-muted">
              {UNIT_TYPE_LABEL[unit.type] ?? unit.type} ·{" "}
              {unit.departments.length} département
              {unit.departments.length > 1 ? "s" : ""}
            </span>
          </summary>

          <div className="border-t border-glass-border px-4 py-3">
            {unit.departments.length === 0 ? (
              <p className="text-sm text-muted">Aucun département renseigné.</p>
            ) : (
              <ul className="flex flex-col">
                {unit.departments.map((dept) => {
                  const count = dept.programs.length;
                  const row = (
                    <>
                      <span>{dept.name}</span>
                      <span className="shrink-0 tabular-nums text-xs text-muted-dark">
                        {count}
                      </span>
                    </>
                  );
                  // Un département sans formation n'a pas de cible dans la
                  // section Formations : on ne le rend pas cliquable, sinon
                  // l'ancre ne mène nulle part.
                  return (
                    <li key={dept.id}>
                      {count === 0 ? (
                        <span className="flex items-baseline justify-between gap-4 px-2 py-1.5 text-sm text-muted-dark">
                          {row}
                        </span>
                      ) : (
                        <a
                          href={`#dept-${dept.id}`}
                          className="flex items-baseline justify-between gap-4 rounded-button px-2 py-1.5 text-sm text-muted outline-none transition-colors duration-150 ease-out hover:bg-glass-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {row}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
