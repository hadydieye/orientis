import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle, BadgeCheck, Database, FileSearch, Mail, ShieldCheck,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getHomeData } from "@/lib/queries/home";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Comment Orientis collecte ses données, comment la fiabilité de chaque information est signalée, et comment nous contacter.",
};

export const revalidate = 3600;

function Section({
  icon: Icon, title, children,
}: {
  icon: typeof Database; title: string; children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-button border border-glass-border bg-glass-2 text-secondary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {title}
      </h2>
      <div className="flex flex-col gap-3 leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default async function AProposPage() {
  // Les chiffres viennent des mêmes requêtes que la page d'accueil : aucune
  // valeur en dur, et rien à mettre à jour à la main quand le catalogue bouge.
  const { stats } = await getHomeData();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 pb-24 sm:px-6">
      <header className="animate-fade-in-up flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          À propos d&apos;
          <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
            Orientis
          </span>
        </h1>
        <p className="text-lg leading-relaxed text-muted">
          Un catalogue de l&apos;enseignement supérieur guinéen, pensé pour les
          bacheliers qui doivent choisir une filière sans toujours savoir ce qui
          existe, ni où.
        </p>
      </header>

      <GlassPanel variant="2" className="p-6 sm:p-8">
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { label: "Établissements", value: String(stats.institutions) },
            { label: "Formations", value: String(stats.programs) },
            { label: "Villes couvertes", value: String(stats.cities) },
            {
              // Ratio et non nombre nu : même traitement que sur l'accueil.
              // Un « 0 » seul se lirait comme une erreur d'affichage, alors
              // qu'il dit quelque chose de précis sur l'état du catalogue.
              label: "Établissements à seuils vérifiés",
              value: `${stats.institutionsWithVerifiedRequirements} / ${stats.institutions}`,
              hint:
                stats.institutionsWithVerifiedRequirements === 0
                  ? "Aucun seuil n'a encore été confirmé auprès d'un établissement."
                  : undefined,
            },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <dt className="order-2 text-xs text-muted">{stat.label}</dt>
              <dd className="order-1 text-2xl font-bold tabular-nums">{stat.value}</dd>
              {stat.hint && (
                <dd className="order-3 text-xs leading-relaxed text-muted-dark">
                  {stat.hint}
                </dd>
              )}
            </div>
          ))}
        </dl>
      </GlassPanel>

      <Section icon={FileSearch} title="Comment les données sont collectées">
        <p>
          Chaque fiche est saisie à partir de documents existants, pas de
          déclarations. Deux familles de sources alimentent le catalogue :
        </p>
        <ul className="flex flex-col gap-3">
          <li className="rounded-card border border-glass-border bg-glass-1 p-4">
            <strong className="text-foreground">Les sites officiels</strong> des
            établissements et des ministères. C&apos;est la source de référence :
            elle est datée au moment de la consultation, et l&apos;URL exacte est
            conservée pour que chacun puisse vérifier.
          </li>
          <li className="rounded-card border border-glass-border bg-glass-1 p-4">
            <strong className="text-foreground">Des compilations
            communautaires</strong> circulant chaque année auprès des bacheliers.
            Elles couvrent beaucoup plus de filières que les sites officiels,
            mais leur origine n&apos;est pas toujours identifiable et leurs
            chiffres ne sont pas garantis.
          </li>
        </ul>
        <p>
          Rien n&apos;est déduit ni comblé au jugé. Quand un document ne précise
          pas une information — un seuil d&apos;admission, les séries acceptées,
          des frais — le champ reste vide plutôt que d&apos;être rempli par
          approximation. Une case vide est une information : elle dit que la
          donnée n&apos;a pas été trouvée, pas qu&apos;elle n&apos;existe pas.
        </p>
      </Section>

      <Section icon={ShieldCheck} title="La traçabilité, et pourquoi elle prime">
        <p>
          Une moyenne minimale affichée sans contexte se lit comme une règle
          d&apos;admission. Si le chiffre vient d&apos;une compilation non
          vérifiée, c&apos;est une promesse que personne n&apos;a faite. Sur
          Orientis, chaque donnée chiffrée porte donc la fiabilité de sa source
          juste à côté d&apos;elle :
        </p>
        <ul className="flex flex-col gap-3">
          <li className="flex items-start gap-3 rounded-card border border-success/30 bg-success/10 p-4">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            <span>
              <strong className="text-foreground">Officiel · vérifié</strong> — la
              source est un document de l&apos;établissement ou d&apos;une
              autorité, et elle a été consultée à une date connue.
            </span>
          </li>
          <li className="flex items-start gap-3 rounded-card border border-warning/30 bg-warning/10 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            <span>
              <strong className="text-foreground">Non-officiel, à vérifier</strong>{" "}
              — l&apos;information vient d&apos;un tiers ou d&apos;un témoignage.
              Elle est affichée parce qu&apos;elle aide à s&apos;orienter, mais
              elle doit être confirmée auprès de l&apos;établissement avant toute
              décision.
            </span>
          </li>
        </ul>
        <p>
          Cette règle n&apos;a pas d&apos;exception : un seuil non officiel
          n&apos;apparaît jamais sans sa mention, et un badge de reconnaissance
          n&apos;est jamais déduit du statut public ou privé d&apos;un
          établissement. En cas de doute entre afficher une donnée fragile et ne
          rien afficher, nous n&apos;affichons rien.
        </p>
      </Section>

      <Section icon={Database} title="Modération des contributions">
        <p>
          Le catalogue accepte des contributions. Toute soumission arrive en
          attente de relecture et reste invisible du public tant qu&apos;un
          administrateur ne l&apos;a pas validée — cela vaut pour une fiche
          d&apos;établissement comme pour une simple photo. C&apos;est la base
          de données elle-même qui l&apos;impose, pas seulement l&apos;interface.
        </p>
      </Section>

      <Section icon={AlertTriangle} title="Ce que ce site n'est pas">
        <p>
          Orientis n&apos;est pas un service officiel d&apos;orientation et
          n&apos;est affilié à aucun établissement ni ministère. Les informations
          publiées ne remplacent pas les communications officielles des
          établissements, qui restent seules à faire foi pour une inscription.
        </p>
        <p>
          Le catalogue est incomplet et le sait : des formations n&apos;ont pas
          encore de conditions d&apos;admission, aucun frais n&apos;est
          renseigné à ce jour, et certaines procédures d&apos;inscription
          restent à documenter. Ces manques sont visibles sur les fiches plutôt
          que masqués.
        </p>
      </Section>

      <Section icon={Mail} title="Contact">
        <p>
          Une erreur à signaler, une donnée à corriger, un établissement absent ?
          Les signalements précis — avec la source qui permet de vérifier — sont
          les plus utiles.
        </p>
        <a
          href="mailto:orientisgn@proton.me?subject=Signalement%20Orientis"
          className="inline-flex w-fit items-center gap-2 rounded-button bg-linear-to-r from-primary to-secondary px-5 py-2.5 text-sm font-semibold text-white outline-none transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Mail className="h-4 w-4" aria-hidden />
          orientisgn@proton.me
        </a>
      </Section>

      <nav aria-label="Pages principales" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-glass-border pt-8 text-sm">
        {[
          { href: "/explorer", label: "Explorer les établissements" },
          { href: "/formations", label: "Toutes les formations" },
          { href: "/orientation", label: "Trouver ma filière" },
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
  );
}
