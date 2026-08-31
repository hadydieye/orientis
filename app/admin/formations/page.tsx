import { ReviewBadge } from "@/components/admin/ReviewBadge";
import { RowActions } from "@/components/admin/RowActions";
import { StatusFilters, resolveStatus } from "@/components/admin/StatusFilters";
import {
  EmptyState, HeadRow, SectionHeader, TableShell, Th,
} from "@/components/admin/SectionHeader";
import { getAdminPrograms } from "@/lib/queries/admin-catalog";
import { getAdminSession } from "@/lib/auth/admin";
import { LEVEL_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const active = resolveStatus(statut);

  const [rows, session] = await Promise.all([
    getAdminPrograms(active),
    getAdminSession(),
  ]);
  const isAdmin = session?.isAdmin ?? false;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Formations"
        count={rows.length}
        noun="formation"
        activeFilter={active}
        newHref="/admin/formations/nouveau"
        newLabel="Nouvelle formation"
      />
      <StatusFilters basePath="/admin/formations" active={active} />

      {rows.length === 0 ? (
        <EmptyState>Aucune formation pour ce filtre.</EmptyState>
      ) : (
        <TableShell>
          <HeadRow>
            <Th>Nom</Th>
            <Th>Département</Th>
            <Th>Établissement</Th>
            <Th>Niveau</Th>
            <Th>Statut</Th>
            <Th align="right">Actions</Th>
          </HeadRow>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-glass-border last:border-0">
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 text-muted">{p.departmentName}</td>
                <td className="px-4 py-3 text-muted">{p.institutionName}</td>
                <td className="px-4 py-3 text-muted">{LEVEL_LABEL[p.level] ?? p.level}</td>
                <td className="px-4 py-3"><ReviewBadge status={p.reviewStatus} /></td>
                <td className="px-4 py-3">
                  <RowActions
                    table="programs"
                    id={p.id}
                    label={p.name}
                    entityLabel="cette formation"
                    reviewStatus={p.reviewStatus}
                    isAdmin={isAdmin}
                    editHref={`/admin/formations/${p.id}/modifier`}
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
