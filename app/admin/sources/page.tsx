import { Info } from "lucide-react";
import { SourceTag } from "@/components/admin/SourceTag";
import { SourceRowActions } from "@/components/admin/SourceRowActions";
import {
  EmptyState, HeadRow, SectionHeader, TableShell, Th,
} from "@/components/admin/SectionHeader";
import { getAdminSources } from "@/lib/queries/admin-catalog";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  officiel: "Officiel", etudiant: "Étudiant", tiers: "Tiers",
};
const STATUS_LABEL: Record<string, string> = {
  verifie: "Vérifié", a_verifier: "À vérifier", obsolete: "Obsolète",
};

export default async function AdminSourcesPage() {
  const [rows, session] = await Promise.all([getAdminSources(), getAdminSession()]);
  const isAdmin = session?.isAdmin ?? false;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Sources"
        count={rows.length}
        noun="source"
        activeFilter="tous"
        newHref="/admin/sources/nouveau"
        newLabel="Nouvelle source"
      />

      {rows.length === 0 ? (
        <EmptyState>Aucune source enregistrée.</EmptyState>
      ) : (
        <TableShell minWidth="60rem">
          <HeadRow>
            <Th>Libellé</Th>
            <Th>URL</Th>
            <Th>Type</Th>
            <Th>Statut</Th>
            <Th>Fiabilité</Th>
            <Th>Vérifiée le</Th>
            <Th align="right">Utilisations</Th>
            <Th align="right">Actions</Th>
          </HeadRow>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-glass-border last:border-0">
                <td className="px-4 py-3">{s.label}</td>
                <td className="max-w-[16rem] px-4 py-3 text-muted">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate rounded text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
                      title={s.url}
                    >
                      {s.url}
                    </a>
                  ) : (
                    <span className="text-muted-dark">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{TYPE_LABEL[s.sourceType] ?? s.sourceType}</td>
                <td className="px-4 py-3 text-muted">{STATUS_LABEL[s.status] ?? s.status}</td>
                <td className="px-4 py-3">
                  <SourceTag source={{ label: s.label, sourceType: s.sourceType, status: s.status }} />
                </td>
                <td className="px-4 py-3 text-muted tabular-nums">
                  {s.verifiedAt ?? <span className="text-muted-dark">—</span>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {s.total === 0 ? (
                    <span className="text-muted-dark">0</span>
                  ) : (
                    <span title={`${s.admissionRequirements} condition(s) d'admission · ${s.fees} ligne(s) de frais · ${s.institutions} fiche(s) d'établissement`}>
                      {s.total}
                      <span className="ml-1 text-xs text-muted">
                        ({s.admissionRequirements}+{s.fees}+{s.institutions})
                      </span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <SourceRowActions
                    id={s.id}
                    label={s.label}
                    referenceCount={s.total}
                    isAdmin={isAdmin}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <p className="flex items-start gap-2 rounded-card border border-glass-border bg-background p-4 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          La colonne <strong className="text-foreground">Utilisations</strong>{" "}
          compte les conditions d&apos;admission et les lignes de frais
          rattachées ({"conditions+frais+fiches"}). Une source utilisée ne peut pas
          être supprimée : il faut d&apos;abord rattacher ces lignes ailleurs.
          La création et la modification sont réservées aux administrateurs —
          une source porte la traçabilité de tout le catalogue.
        </span>
      </p>
    </div>
  );
}
