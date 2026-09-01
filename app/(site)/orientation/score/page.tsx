import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, ArrowLeft, HelpCircle } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { INTEREST_TO_DOMAINS } from "@/lib/orientation/score";

export const metadata: Metadata = {
  title: "Comment calculons-nous ce score ?",
  description:
    "La formule exacte du score de correspondance des recommandations d'orientation, critère par critère.",
};

const ROWS = [
  {
    points: "+2",
    label: "Série acceptée",
    rule: "La série que vous avez indiquée figure explicitement dans les séries acceptées enregistrées pour cette formation.",
    zero: "0 point si les séries acceptées ne sont pas renseignées — l'absence d'information ne vaut pas confirmation.",
  },
  {
    points: "+2",
    label: "Seuil d'admission atteint",
    rule: "Une moyenne minimale est enregistrée, et la vôtre l'atteint.",
    zero: "0 point si aucun seuil n'est enregistré. La formation n'est pas écartée pour autant, mais rien ne confirme qu'elle vous est accessible.",
  },
  {
    points: "+1",
    label: "Information de source officielle",
    rule: "Le seuil provient d'une source à la fois officielle et vérifiée.",
    zero: "0 point pour une source tierce ou non vérifiée, et 0 point si aucune source n'est rattachée.",
  },
  {
    points: "+1",
    label: "Ville souhaitée",
    rule: "L'établissement se trouve dans la ville que vous avez indiquée.",
    zero: "Critère non compté si vous n'avez indiqué aucune ville.",
  },
  {
    points: "+1",
    label: "Domaine correspondant à vos intérêts",
    rule: "Le domaine de la formation fait partie des domaines associés aux intérêts que vous avez cochés.",
    zero: "Critère non compté si vous n'avez déclaré aucun intérêt.",
  },
];

export default function ScorePage() {
  const mapped = Object.entries(INTEREST_TO_DOMAINS);

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
          seuil non communiqué, séries non renseignées — reste compté et rapporte
          zéro. C&apos;est volontaire : le manque doit se voir.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight">
          Intérêts et domaines : la table de correspondance
        </h2>
        <p className="leading-relaxed text-muted">
          Le rapprochement entre un intérêt coché et le domaine d&apos;une
          formation suit une table fixe, publiée ici. Ce n&apos;est pas une
          comparaison de mots approximative : deux libellés qui se ressemblent ne
          désignent pas forcément la même chose, et un rapprochement flou serait
          invérifiable.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {mapped.map(([interest, domains]) => (
            <li
              key={interest}
              className="flex flex-col gap-1 rounded-card border border-glass-border bg-glass-1 p-3 text-sm"
            >
              <span className="font-medium">{interest}</span>
              <span className="text-muted">
                {domains.length > 0 ? (
                  domains.join(", ")
                ) : (
                  <span className="text-muted-dark">
                    aucun domaine correspondant en base pour l&apos;instant
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="flex items-start gap-2 rounded-card border border-warning/30 bg-warning/10 p-4 text-sm leading-relaxed">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <span>
            Le champ « domaine » n&apos;est renseigné que sur une poignée de
            formations. Ce critère joue donc rarement, et nous le signalons sur
            la page de résultats plutôt que de laisser croire qu&apos;il pèse
            dans le classement. Il s&apos;activera à mesure que le champ sera
            complété.
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
          Les seuils affichés proviennent en grande majorité de sources non
          officielles. Quel que soit le score, confirmez-les auprès de
          l&apos;établissement avant toute démarche.
        </p>
      </section>
    </main>
  );
}
