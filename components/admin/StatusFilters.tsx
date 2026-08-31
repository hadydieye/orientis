import Link from "next/link";
import { cn } from "@/lib/cn";

export const STATUS_FILTERS = [
  { value: "tous", label: "Tous" },
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Validés" },
  { value: "rejected", label: "Rejetés" },
];

export function resolveStatus(statut?: string) {
  return STATUS_FILTERS.some((f) => f.value === statut) ? statut! : "tous";
}

export function StatusFilters({ basePath, active }: { basePath: string; active: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
      {STATUS_FILTERS.map((f) => (
        <Link
          key={f.value}
          href={`${basePath}${f.value === "tous" ? "" : `?statut=${f.value}`}`}
          aria-current={active === f.value ? "true" : undefined}
          className={cn(
            "rounded-pill border px-3 py-1.5 text-sm outline-none transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-primary",
            active === f.value
              ? "border-primary/40 bg-primary/20 text-foreground"
              : "border-glass-border bg-background text-muted hover:text-foreground"
          )}
        >
          {f.label}
        </Link>
      ))}
    </div>
  );
}
