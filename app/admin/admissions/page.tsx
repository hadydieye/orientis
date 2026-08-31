import { ReviewBadge } from "@/components/admin/ReviewBadge";
import { RowActions } from "@/components/admin/RowActions";
import { SourceTag } from "@/components/admin/SourceTag";
import { StatusFilters, resolveStatus } from "@/components/admin/StatusFilters";
import {
  EmptyState, HeadRow, SectionHeader, TableShell, Th,
} from "@/components/admin/SectionHeader";
import { getAdminAdmissionRequirements } from "@/lib/queries/admin-catalog";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminAdmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const active = resolveStatus(statut);

  const [rows, session] = await Promise.all([
    getAdminAdmissionRequirements(active),
    getAdminSession(),
  ]);
  const isAdmin = session?.isAdmin ?? false;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Conditions d'admission"
        count={rows.length}
        noun="condition"
        activeFilter={active}
        newHref="/admin/admissions/nouveau"
        newLabel="Nouvelle condition"
      />
      <StatusFilters basePath="/admin/admissions" active={active} />

      {rows.length === 0 ? (
        <EmptyState>Aucune condition d&apos;admission pour ce filtre.</EmptyState>
      ) : (
        <TableShell minWidth="58rem">
          <HeadRow>
            <Th>Formation</Th>
            <Th>Année</Th>
            <Th>Séries acceptées</Th>
            <Th align="right">Moyenne min.</Th>
            <Th>Statut</Th>
            <Th>Source</Th>
            <Th align="right">Actions</Th>
          </HeadRow>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-glass-border last:border-0">
                <td className="px-4 py-3">{r.programName}</td>
                <td className="px-4 py-3 text-muted">{r.yearLabel}</td>
                <td className="px-4 py-3 text-muted">
                  {r.acceptedSeries && r.acceptedSeries.length > 0 ? (
                    r.acceptedSeries.join(", ")
                  ) : (
                    <span className="text-muted-dark">non renseignées</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {r.minAverage === null ? (
                    <span className="text-muted-dark">non communiquée</span>
                  ) : (
                    r.minAverage
                  )}
                </td>
                <td className="px-4 py-3"><ReviewBadge status={r.reviewStatus} /></td>
                <td className="px-4 py-3"><SourceTag source={r.source} /></td>
                <td className="px-4 py-3">
                  <RowActions
                    table="admission_requirements"
                    id={r.id}
                    label={`${r.programName} — ${r.yearLabel}`}
                    entityLabel="cette condition d'admission"
                    reviewStatus={r.reviewStatus}
                    isAdmin={isAdmin}
                    editHref={`/admin/admissions/${r.id}/modifier`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
