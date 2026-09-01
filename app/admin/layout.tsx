import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getAdminSession();

  // Non authentifié -> connexion (hors /admin, sinon boucle de redirection).
  if (!session) redirect("/connexion?next=/admin");

  // Authentifié mais sans rôle : 403 explicite, pas une redirection muette.
  if (!session.isAdmin && !session.isContributeur) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-warning" aria-hidden />
        <h1 className="text-xl font-bold">Accès refusé</h1>
        <p className="text-sm leading-relaxed text-muted">
          Votre compte ({session.email}) est authentifié mais ne dispose
          d&apos;aucun rôle sur le back-office. Demandez à un administrateur de
          vous attribuer le rôle contributeur ou admin.
        </p>
        <Link
          href="/"
          className="rounded text-sm text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
        >
          Retour au site
        </Link>
      </main>
    );
  }

  return (
    // Pas d'aurora ni de backdrop-blur ici : le back-office garde les tokens
    // Aurora Glass mais vise la lisibilité, pas l'effet.
    <div className="flex min-h-screen flex-1 flex-col bg-background-secondary lg:flex-row">
      <aside className="border-b border-glass-border bg-background px-4 py-5 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/admin"
            aria-label="Orientis admin — vue d'ensemble"
            className="flex items-center gap-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Logo size={26} textClassName="text-base" />
            <span className="text-sm text-muted">admin</span>
          </Link>
        </div>

        <AdminSidebar />

        <div className="mt-6 border-t border-glass-border pt-4 text-xs text-muted-dark">
          <p className="break-all">{session.email}</p>
          <p className="mt-1">
            {session.roles.length > 0 ? session.roles.join(", ") : "aucun rôle"}
          </p>
          <Link
            href="/"
            className="mt-3 inline-block rounded text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
          >
            Voir le site public
          </Link>
        </div>
      </aside>

      <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
