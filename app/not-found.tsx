import Link from "next/link";
import { Home, Search } from "lucide-react";
import { AuroraBackground } from "@/components/layout/AuroraBackground";
import { Logo } from "@/components/layout/Logo";

/**
 * 404 personnalisée.
 *
 * Elle vit à la racine, hors du groupe (site) : une URL inconnue ne
 * correspond à aucun segment, donc le layout du groupe ne s'applique pas et
 * la page doit apporter son propre fond. D'où l'AuroraBackground ici, et le
 * padding vertical qui remplace celui du layout.
 */
export default function NotFound() {
  return (
    <>
      <AuroraBackground />
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-4 py-24 text-center sm:px-6">
        <div className="animate-fade-in-up flex flex-col items-center gap-5">
          <Logo size={56} withWordmark={false} />

          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
            Erreur 404
          </p>

          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Cette page n&apos;existe{" "}
            <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
              pas
            </span>
          </h1>

          <p className="max-w-md leading-relaxed text-muted">
            Le lien est peut-être incomplet, ou la fiche que vous cherchez
            n&apos;a pas encore été publiée — le catalogue s&apos;enrichit
            progressivement, et rien n&apos;apparaît avant d&apos;avoir été
            vérifié.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-button bg-linear-to-r from-primary to-secondary px-5 py-2.5 text-sm font-semibold text-white outline-none transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Home className="h-4 w-4" aria-hidden />
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/explorer"
            className="inline-flex items-center justify-center gap-2 rounded-button border border-glass-border bg-glass-1 px-5 py-2.5 text-sm font-medium outline-none transition-colors duration-150 ease-out hover:border-glass-border-hover focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Search className="h-4 w-4" aria-hidden />
            Explorer le catalogue
          </Link>
        </div>

        <nav aria-label="Pages principales" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          {[
            { href: "/formations", label: "Toutes les formations" },
            { href: "/orientation", label: "Trouver ma filière" },
            { href: "/a-propos", label: "À propos" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded text-secondary outline-none transition-opacity duration-150 ease-out hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </main>
    </>
  );
}
