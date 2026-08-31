import { ReviewBadge } from "@/components/admin/ReviewBadge";
import { RowActions } from "@/components/admin/RowActions";
import { StatusFilters, resolveStatus } from "@/components/admin/StatusFilters";
import {
  EmptyState, HeadRow, SectionHeader, TableShell, Th,
} from "@/components/admin/SectionHeader";
import { getAdminInstitutions } from "@/lib/queries/admin";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  universite: "Université",
  institut: "Institut",
  ecole: "École",
};

export default async function AdminInstitutionsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const active = resolveStatus(statut);

  const [rows, session] = await Promise.all([
    getAdminInstitutions(active),
    getAdminSession(),
  ]);
  const isAdmin = session?.isAdmin ?? false;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Établissements"
        count={rows.length}
        noun="établissement"
        activeFilter={active}
        newHref="/admin/institutions/nouveau"
        newLabel="Nouvel établissement"
      />
      <StatusFilters basePath="/admin/institutions" active={active} />

      {rows.length === 0 ? (
        <EmptyState>Aucun établissement pour ce filtre.</EmptyState>
      ) : (
        <TableShell minWidth="52rem">
          <HeadRow>
            <Th>Nom</Th>
            <Th>Ville</Th>
            <Th>Type</Th>
            <Th>Nature</Th>
            <Th>Statut</Th>
            <Th align="right">Formations</Th>
            <Th align="right">Actions</Th>
          </HeadRow>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} className="border-b border-glass-border last:border-0">
                <td className="px-4 py-3">{i.name}</td>
                <td className="px-4 py-3 text-muted">{i.city ?? "—"}</td>
                <td className="px-4 py-3 text-muted">
                  {i.type === "public" ? "Public" : "Privé"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {STATUS_LABEL[i.status] ?? i.status}
                </td>
                <td className="px-4 py-3"><ReviewBadge status={i.reviewStatus} /></td>
                <td className="px-4 py-3 text-right tabular-nums">{i.programCount}</td>
                <td className="px-4 py-3">
                  <RowActions
                    table="institutions"
                    id={i.id}
                    label={i.name}
                    entityLabel="cet établissement"
                    reviewStatus={i.reviewStatus}
                    isAdmin={isAdmin}
                    editHref={`/admin/institutions/${i.id}/modifier`}
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
