import { AlertTriangle, Info } from "lucide-react";
import { RoleToggles } from "@/components/admin/RoleToggles";
import { HeadRow, TableShell, Th } from "@/components/admin/SectionHeader";
import { listUsers } from "@/lib/api/users";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit", month: "2-digit", year: "numeric",
});
const fmt = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "—");

export default async function AdminUsersPage() {
  const session = await getAdminSession();

  if (!session?.isAdmin) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Utilisateurs &amp; rôles</h1>
        <p className="flex items-start gap-2 rounded-card border border-warning/30 bg-warning/10 p-4 text-sm leading-relaxed">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <span>
            Cette section est réservée aux administrateurs. Elle liste les
            comptes du projet et permet d&apos;attribuer les rôles.
          </span>
        </p>
      </div>
    );
  }

  const users = await listUsers();
  const adminCount = users.filter((u) => u.roles.includes("admin")).length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Utilisateurs &amp; rôles</h1>
        <p className="mt-1 text-sm text-muted">
          {users.length} compte{users.length > 1 ? "s" : ""} · {adminCount}{" "}
          administrateur{adminCount > 1 ? "s" : ""}
        </p>
      </header>

      {adminCount <= 1 && (
        <p className="flex items-start gap-2 rounded-card border border-warning/30 bg-warning/10 p-4 text-sm leading-relaxed">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <span>
            Un seul compte administrateur. Perdre l&apos;accès à ce compte
            fermerait le back-office : plus personne ne pourrait valider ni
            supprimer. Son rôle admin n&apos;est pas retirable tant qu&apos;il
            est le seul.
          </span>
        </p>
      )}

      <TableShell minWidth="48rem">
        <HeadRow>
          <Th>E-mail</Th>
          <Th>Rôles</Th>
          <Th>Créé le</Th>
          <Th>Dernière connexion</Th>
          <Th align="right">Actions</Th>
        </HeadRow>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-glass-border last:border-0">
              <td className="px-4 py-3">
                <span className="break-all">
                  {u.email ?? <span className="text-muted-dark">(sans e-mail)</span>}
                </span>
              </td>
              <td className="px-4 py-3 text-muted">
                {u.roles.length ? (
                  u.roles.join(", ")
                ) : (
                  <span className="text-muted-dark">aucun rôle</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted tabular-nums">{fmt(u.createdAt)}</td>
              <td className="px-4 py-3 text-muted tabular-nums">{fmt(u.lastSignInAt)}</td>
              <td className="px-4 py-3">
                <RoleToggles
                  userId={u.id}
                  email={u.email}
                  roles={u.roles}
                  isSelf={u.id === session.userId}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>

      <p className="flex items-start gap-2 rounded-card border border-glass-border bg-background p-4 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          Un clic sur un rôle l&apos;attribue ou le retire.{" "}
          <strong className="text-foreground">contributeur</strong> permet de
          soumettre des contributions et de corriger les siennes tant
          qu&apos;elles sont en attente ;{" "}
          <strong className="text-foreground">admin</strong> ajoute la
          modération et la suppression. La création de comptes ne se fait pas
          ici : elle passe par l&apos;inscription ou le dashboard Supabase.
        </span>
      </p>
    </div>
  );
}
