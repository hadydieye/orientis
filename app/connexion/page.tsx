import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminSession } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Connexion — Orientis" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // On n'accepte qu'un chemin interne : évite une redirection ouverte.
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  const session = await getAdminSession();
  if (session) redirect(target);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Connexion</h1>
        <p className="text-sm text-muted">
          Espace réservé aux contributeurs et administrateurs.
        </p>
      </div>

      <LoginForm next={target} />

      <Link
        href="/"
        className="rounded text-center text-sm text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
      >
        Retour au site
      </Link>
    </main>
  );
}
