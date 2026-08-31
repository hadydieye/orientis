import { ReviewBadge } from "@/components/admin/ReviewBadge";
import { RowActions } from "@/components/admin/RowActions";
import { SourceTag } from "@/components/admin/SourceTag";
import { StatusFilters, resolveStatus } from "@/components/admin/StatusFilters";
import {
  EmptyState, HeadRow, SectionHeader, TableShell, Th,
} from "@/components/admin/SectionHeader";
import { getAdminFees } from "@/lib/queries/admin-catalog";
import { getAdminSession } from "@/lib/auth/admin";
import { FEE_TYPE_LABEL, FREQUENCY_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const active = resolveStatus(statut);

  const [rows, session] = await Promise.all([getAdminFees(active), getAdminSession()]);
  const isAdmin = session?.isAdmin ?? false;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Frais"
        count={rows.length}
        noun="ligne de frais"
        activeFilter={active}
        newHref="/admin/frais/nouveau"
        newLabel="Nouveaux frais"
      />
      <StatusFilters basePath="/admin/frais" active={active} />

      {rows.length === 0 ? (
        <EmptyState>
          Aucune ligne de frais pour ce filtre. Cette table est vide : aucun
          montant n&apos;a encore été saisi, et rien n&apos;est donc affiché sur
          le site public.
        </EmptyState>
      ) : (
        <TableShell minWidth="58rem">
          <HeadRow>
            <Th>Formation</Th>
            <Th>Année</Th>
            <Th>Type</Th>
            <Th align="right">Montant</Th>
            <Th>Fréquence</Th>
            <Th>Statut</Th>
            <Th>Source</Th>
            <Th align="right">Actions</Th>
          </HeadRow>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id} className="border-b border-glass-border last:border-0">
                <td className="px-4 py-3">{f.programName}</td>
                <td className="px-4 py-3 text-muted">{f.yearLabel}</td>
                <td className="px-4 py-3 text-muted">
                  {FEE_TYPE_LABEL[f.feeType] ?? f.feeType}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {f.amount === null ? (
                    <span className="text-muted-dark">non communiqué</span>
                  ) : (
                    `${f.amount.toLocaleString("fr-FR")} ${f.currency}`
                  )}
                </td>
                <td className="px-4 py-3 text-muted">
                  {FREQUENCY_LABEL[f.frequency] ?? f.frequency}
                </td>
                <td className="px-4 py-3"><ReviewBadge status={f.reviewStatus} /></td>
                <td className="px-4 py-3"><SourceTag source={f.source} /></td>
                <td className="px-4 py-3">
                  <RowActions
                    table="fees"
                    id={f.id}
                    label={`${f.programName} — ${FEE_TYPE_LABEL[f.feeType] ?? f.feeType}`}
                    entityLabel="cette ligne de frais"
                    reviewStatus={f.reviewStatus}
                    isAdmin={isAdmin}
                    editHref={`/admin/frais/${f.id}/modifier`}
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
