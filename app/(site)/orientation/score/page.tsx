import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, ArrowLeft, HelpCircle } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { INTEREST_KEYWORDS } from "@/lib/orientation/interests";

export const metadata: Metadata = {
  title: "Comment calculons-nous ce score ?",
  description:
    "La formule exacte du score de correspondance des recommandations d'orientation, critère par critère.",
};

const ROWS = [
  {
    points: "+1",
    label: "Ville souhaitée",
    rule: "Un des établissements qui proposent la formation se trouve dans la ville que vous avez indiquée.",
    zero: "Critère non compté si vous n'avez indiqué aucune ville. 0 point si la formation n'a aucun établissement rattaché.",
  },
  {
    points: "+1",
    label: "Correspond à vos centres d'intérêt",
    rule: "L'intitulé de la formation ou l'un des métiers auxquels elle mène contient un mot-clé associé à un intérêt que vous avez coché.",
    zero: "Critère non compté si vous n'avez déclaré aucun intérêt.",
  },
  {
    points: "+1",
    label: "Catégorie de diplôme souhaitée",
    rule: "La formation appartient à la catégorie que vous avez choisie.",
    zero: "Critère non compté si vous n'avez choisi aucune catégorie.",
  },
];


export default function ScorePage() {
  const mapped = Object.entries(INTEREST_KEYWORDS);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 pb-24 sm:px-6">
      <div className="animate-fade-in-up flex flex-col gap-4">
        <Link
          href="/orientation"
          className="inline-flex w-fit items-center gap-1.5 rounded text-sm text-muted outline-none transition-colors duration-150 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour à l&apos;orientation
        </Link>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Comment calculons-nous ce score&nbsp;?
        </h1>
      </div>

      <GlassPanel variant="2" className="flex flex-col gap-4 p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" aria-hidden />
          Ce score n&apos;est pas une chance d&apos;admission
        </h2>
        <p className="leading-relaxed text-muted">
          Ce n&apos;est ni une probabilité, ni un pourcentage de compatibilité.
          Rien dans nos données ne permettrait de calculer une telle valeur :
          nous n&apos;avons ni statistiques d&apos;admission, ni nombre de
          places, ni historique de candidatures. Un pourcentage serait un chiffre
          inventé, et nous préférons ne pas en afficher du tout.
        </p>
        <p className="leading-relaxed text-muted">
          Ce score compte des{" "}
          <strong className="text-foreground">critères vérifiables</strong>.
          Chaque point correspond à un fait précis, affiché à côté de la
          formation. Si une carte indique 5 points, vous pouvez lire lesquels.
          Deux formations à égalité ne sont pas pour autant équivalentes : le
          score dit ce qui est confirmé, pas ce que vous obtiendrez.
        </p>
      </GlassPanel>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight">La formule</h2>
        <div className="overflow-x-auto rounded-card border border-glass-border bg-glass-1">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-glass-border text-left text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="px-4 py-3 font-medium">Points</th>
                <th scope="col" className="px-4 py-3 font-medium">Critère</th>
                <th scope="col" className="px-4 py-3 font-medium">Condition</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label} className="border-b border-glass-border last:border-0 align-top">
                  <td className="px-4 py-4 font-semibold tabular-nums text-secondary">{r.points}</td>
                  <td className="px-4 py-4 font-medium">{r.label}</td>
                  <td className="px-4 py-4 text-muted">
                    <p className="leading-relaxed">{r.rule}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-dark">{r.zero}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="leading-relaxed text-muted">
          Le maximum affiché s&apos;adapte à ce que vous avez renseigné. Si vous
          n&apos;indiquez pas de ville, le critère correspondant sort du total :
          ne pas répondre à une question facultative ne doit pas faire baisser
          toutes les formations. En revanche, un critère dont la{" "}
          <strong className="text-foreground">donnée manque en base</strong> —
          une formation sans établissement rattaché, par exemple — reste compté
          et rapporte zéro. C&apos;est volontaire : le manque doit se voir.
        </p>
        <p className="leading-relaxed text-muted">
          Votre profil d&apos;entrée, lui, n&apos;est{" "}
          <strong className="text-foreground">pas</strong> un critère noté :
          c&apos;est un filtre. Une formation fermée à votre série
          n&apos;apparaît pas du tout, plutôt que d&apos;apparaître avec un
          point en moins. Les séries franco-arabes ouvrent sur des formations
          qui leur sont propres et ne se confondent avec aucune autre.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight">
          Centres d&apos;intérêt : les mots-clés cherchés
        </h2>
        <p className="leading-relaxed text-muted">
          Cocher un intérêt revient à chercher ces racines de mots dans
          l&apos;intitulé de la formation et dans les libellés des métiers
          auxquels elle mène. La comparaison ignore les accents et la casse :
          « génie civil » et « Genie Civil » donnent le même résultat. La liste
          complète est publiée ici, pour que le résultat soit vérifiable.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {mapped.map(([interest, keywords]) => (
            <li
              key={interest}
              className="flex flex-col gap-1 rounded-card border border-glass-border bg-glass-1 p-3 text-sm"
            >
              <span className="font-medium">{interest}</span>
              <span className="text-muted">{keywords.join(" · ")}</span>
            </li>
          ))}
        </ul>
        <p className="flex items-start gap-2 rounded-card border border-warning/30 bg-warning/10 p-4 text-sm leading-relaxed">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <span>
            Une recherche par mots-clés reste un filet large : elle peut
            rapprocher une formation d&apos;un intérêt de façon discutable, ou
            en manquer une. Ne cocher aucun intérêt n&apos;écarte rien — c&apos;est
            la garantie qu&apos;aucune formation ne devient invisible.
          </span>
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight">Où le score est calculé</h2>
        <p className="leading-relaxed text-muted">
          La formule vit dans un seul fichier,{" "}
          <code className="rounded bg-glass-2 px-1.5 py-0.5 text-xs">
            lib/orientation/score.ts
          </code>
          , et est recalculée à chaque requête à partir des champs affichés sur
          la carte. Aucun score n&apos;est stocké : il ne peut donc pas diverger
          de ce que vous lisez.
        </p>
        <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-dark">
          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Les formations proviennent du portail officiel ParcourSup Guinée, qui
          ne publie aucune condition d&apos;admission chiffrée. Quel que soit le
          score, renseignez-vous auprès de l&apos;établissement avant toute
          démarche.
        </p>
      </section>
    </main>
  );
}
