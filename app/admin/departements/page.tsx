import { ReviewBadge } from "@/components/admin/ReviewBadge";
import { RowActions } from "@/components/admin/RowActions";
import { StatusFilters, resolveStatus } from "@/components/admin/StatusFilters";
import {
  EmptyState, HeadRow, SectionHeader, TableShell, Th,
} from "@/components/admin/SectionHeader";
import { getAdminDepartments } from "@/lib/queries/admin-catalog";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminDepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const active = resolveStatus(statut);

  const [rows, session] = await Promise.all([
    getAdminDepartments(active),
    getAdminSession(),
  ]);
  const isAdmin = session?.isAdmin ?? false;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Départements"
        count={rows.length}
        noun="département"
        activeFilter={active}
        newHref="/admin/departements/nouveau"
        newLabel="Nouveau département"
      />
      <StatusFilters basePath="/admin/departements" active={active} />

      {rows.length === 0 ? (
        <EmptyState>Aucun département pour ce filtre.</EmptyState>
      ) : (
        <TableShell>
          <HeadRow>
            <Th>Nom</Th>
            <Th>Unité académique</Th>
            <Th>Établissement</Th>
            <Th>Statut</Th>
            <Th align="right">Formations</Th>
            <Th align="right">Actions</Th>
          </HeadRow>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-b border-glass-border last:border-0">
                <td className="px-4 py-3">{d.name}</td>
                <td className="px-4 py-3 text-muted">{d.unitName}</td>
                <td className="px-4 py-3 text-muted">{d.institutionName}</td>
                <td className="px-4 py-3"><ReviewBadge status={d.reviewStatus} /></td>
                <td className="px-4 py-3 text-right tabular-nums">{d.programCount}</td>
                <td className="px-4 py-3">
                  <RowActions
                    table="departments"
                    id={d.id}
                    label={d.name}
                    entityLabel="ce département"
                    reviewStatus={d.reviewStatus}
                    isAdmin={isAdmin}
                    editHref={`/admin/departements/${d.id}/modifier`}
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
