import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getAdminCounts } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-card border border-glass-border bg-background p-4">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const c = await getAdminCounts();
  const roleNames = Object.keys(c.rolesByName);
  const totalPending = c.pendingByTable.reduce((n, p) => n + p.count, 0);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-sm text-muted">
          Compteurs réels, toutes lignes confondues (y compris celles en
          attente, invisibles sur le site public).
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Catalogue
        </h2>
        {c.usesServiceRoleFallback && (
          <p className="flex items-start gap-2 rounded-card border border-glass-border bg-background p-3 text-xs leading-relaxed text-muted">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            <span>
              Les 6 compteurs du catalogue sont lus sous RLS avec votre
              session, via <code>staff_read_all</code>. Seule la répartition des
              rôles passe encore par une lecture privilégiée :{" "}
              <code>user_roles</code> n&apos;expose à chacun que ses propres
              lignes, et y poser une policy globale demande d&apos;écarter
              d&apos;abord le risque de récursion via <code>has_role()</code>.
            </span>
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Établissements" value={c.institutions} />
          <Stat label="Unités académiques" value={c.academicUnits} />
          <Stat label="Départements" value={c.departments} />
          <Stat label="Formations" value={c.programs} />
          <Stat label="Conditions d'admission" value={c.admissionRequirements} />
          <Stat label="Frais" value={c.fees} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Modération
        </h2>
        {totalPending === 0 ? (
          <p className="rounded-card border border-glass-border bg-background p-5 text-sm text-muted">
            Aucune contribution en attente sur les 6 tables du catalogue.
          </p>
        ) : (
          <div className="rounded-card border border-glass-border bg-background">
            <p className="border-b border-glass-border px-5 py-4 text-sm">
              <strong className="text-lg tabular-nums">{totalPending}</strong>{" "}
              contribution{totalPending > 1 ? "s" : ""} en attente de validation
            </p>
            <ul>
              {c.pendingByTable
                .filter((p) => p.count > 0)
                .map((p) => (
                  <li
                    key={p.key}
                    className="flex items-center justify-between gap-4 border-b border-glass-border px-5 py-3 text-sm last:border-0"
                  >
                    <span className="text-muted">{p.label}</span>
                    <Link
                      href={`${p.href}?statut=pending`}
                      className="rounded text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {p.count} à traiter
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Utilisateurs par rôle
        </h2>
        {roleNames.length === 0 ? (
          <p className="flex items-start gap-2 rounded-card border border-glass-border bg-background p-5 text-sm text-muted">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            Aucun rôle n&apos;est attribué dans <code>user_roles</code>. Tant
            que la table est vide, personne ne peut contribuer ni valider —
            y compris via les routes API, dont l&apos;autorisation repose sur
            ces rôles.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {roleNames.sort().map((role) => (
              <Stat key={role} label={role} value={c.rolesByName[role]} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
