import { ReviewBadge } from "@/components/admin/ReviewBadge";
import { RowActions } from "@/components/admin/RowActions";
import { StatusFilters, resolveStatus } from "@/components/admin/StatusFilters";
import {
  EmptyState, HeadRow, SectionHeader, TableShell, Th,
} from "@/components/admin/SectionHeader";
import { getAdminAcademicUnits } from "@/lib/queries/admin-catalog";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  faculte: "Faculté",
  institut: "Institut",
  centre: "Centre",
};

export default async function AdminAcademicUnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const active = resolveStatus(statut);

  const [rows, session] = await Promise.all([
    getAdminAcademicUnits(active),
    getAdminSession(),
  ]);
  const isAdmin = session?.isAdmin ?? false;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Unités académiques"
        count={rows.length}
        noun="unité"
        activeFilter={active}
        newHref="/admin/unites/nouveau"
        newLabel="Nouvelle unité"
      />
      <StatusFilters basePath="/admin/unites" active={active} />

      {rows.length === 0 ? (
        <EmptyState>Aucune unité académique pour ce filtre.</EmptyState>
      ) : (
        <TableShell>
          <HeadRow>
            <Th>Nom</Th>
            <Th>Établissement</Th>
            <Th>Type</Th>
            <Th>Statut</Th>
            <Th align="right">Départements</Th>
            <Th align="right">Actions</Th>
          </HeadRow>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-glass-border last:border-0">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-muted">{u.institutionName}</td>
                <td className="px-4 py-3 text-muted">{TYPE_LABEL[u.type] ?? u.type}</td>
                <td className="px-4 py-3"><ReviewBadge status={u.reviewStatus} /></td>
                <td className="px-4 py-3 text-right tabular-nums">{u.departmentCount}</td>
                <td className="px-4 py-3">
                  <RowActions
                    table="academic_units"
                    id={u.id}
                    label={u.name}
                    entityLabel="cette unité académique"
                    reviewStatus={u.reviewStatus}
                    isAdmin={isAdmin}
                    editHref={`/admin/unites/${u.id}/modifier`}
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
