import Link from "next/link";
import { Plus } from "lucide-react";

export function SectionHeader({
  title,
  count,
  noun,
  activeFilter,
  newHref,
  newLabel,
}: {
  title: string;
  count: number;
  /** Nom au singulier, accordé automatiquement au pluriel. */
  noun: string;
  activeFilter: string;
  newHref: string;
  newLabel: string;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted">
          {count} {noun}
          {count > 1 ? "s" : ""}
          {activeFilter !== "tous" ? ` (filtre : ${activeFilter})` : ""}
        </p>
      </div>
      <Link
        href={newHref}
        className="inline-flex items-center gap-1.5 rounded-button bg-linear-to-r from-primary to-secondary px-4 py-2 text-sm font-semibold text-white outline-none transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {newLabel}
      </Link>
    </header>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-card border border-glass-border bg-background p-6 text-sm text-muted">
      {children}
    </p>
  );
}

export function TableShell({ children, minWidth = "52rem" }: { children: React.ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto rounded-card border border-glass-border bg-background">
      <table className="w-full text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 font-medium ${align === "right" ? "text-right" : ""}`}
    >
      {children}
    </th>
  );
}

export function HeadRow({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-glass-border text-left text-xs uppercase tracking-wider text-muted">
        {children}
      </tr>
    </thead>
  );
}
