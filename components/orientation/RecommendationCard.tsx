import Link from "next/link";
import { ArrowRight, Check, ChevronRight, HelpCircle, MapPin, Minus, X } from "lucide-react";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { ReliabilityTag } from "@/components/program/SourceReliability";
import { LEVEL_LABEL } from "@/lib/labels";
import type { Recommendation } from "@/app/(site)/orientation/actions";

import type { ScoreCriterion } from "@/lib/orientation/score";

/**
 * Une ligne de critère, avec l'icône de son état.
 *
 * Les quatre états sont distingués visuellement parce qu'ils ne disent pas la
 * même chose : « rempli », « non rempli », « donnée absente en base » et
 * « préférence non déclarée » ne doivent pas se confondre.
 */
function CriterionRow({ criterion }: { criterion: ScoreCriterion }) {
  const icon = {
    met: <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />,
    unmet: <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-error" aria-hidden />,
    unknown: <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />,
    not_declared: <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-dark" aria-hidden />,
  }[criterion.state];

  return (
    <li className="flex items-start gap-2 text-sm text-muted">
      {icon}
      <span>
        <span className={criterion.state === "met" ? "text-foreground" : undefined}>
          {criterion.label}
        </span>
        {criterion.maxPoints > 0 && (
          <span className="ml-1.5 text-xs tabular-nums text-muted-dark">
            {criterion.points}/{criterion.maxPoints}
          </span>
        )}
        <span className="block text-xs leading-relaxed text-muted-dark">
          {criterion.detail}
        </span>
      </span>
    </li>
  );
}

export function RecommendationCard({
  recommendation,
  series,
  average,
}: {
  recommendation: Recommendation;
  series: string;
  average: number;
}) {
  const { minAverage, acceptedSeries, source, score } = recommendation;

  return (
    <article className="flex flex-col gap-4 rounded-card border border-glass-border bg-glass-1 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold leading-snug">{recommendation.name}</h3>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <Link
              href={`/etablissements/${recommendation.institution.id}`}
              className="rounded text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
            >
              {recommendation.institution.name}
            </Link>
            {recommendation.institution.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {recommendation.institution.city}
              </span>
            )}
          </p>
        </div>

        {/* Un compte de points, jamais un pourcentage : chaque point est
            justifié par une ligne de la liste ci-dessous, et la formule
            complète est publiée sur /orientation/score. */}
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-pill bg-linear-to-r from-primary to-secondary px-3 py-1 text-xs font-semibold tabular-nums text-white">
            {score.total} / {score.max} points
          </span>
          <Link
            href="/orientation/score"
            className="rounded text-[11px] text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
          >
            Comment calculons-nous ce score&nbsp;?
          </Link>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <GlassBadge variant="neutral">
          {LEVEL_LABEL[recommendation.level] ?? recommendation.level}
        </GlassBadge>
        {recommendation.durationYears !== null && (
          <GlassBadge variant="neutral">
            {recommendation.durationYears} an
            {recommendation.durationYears > 1 ? "s" : ""}
          </GlassBadge>
        )}
        {/* Traçabilité visible sur chaque carte, à côté des critères. */}
        <ReliabilityTag source={source} />
      </div>

      <ul className="flex flex-col gap-2">
        {score.criteria.map((c) => (
          <CriterionRow key={c.key} criterion={c} />
        ))}
      </ul>

      <details className="group/why">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-sm text-secondary outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-open/why:rotate-90"
            aria-hidden
          />
          Pourquoi&nbsp;?
        </summary>
        <div className="mt-3 flex flex-col gap-3 border-t border-glass-border pt-3">
          <p className="text-sm leading-relaxed text-muted">
            Cette formation est proposée parce que votre série{" "}
            <strong className="text-foreground">{series}</strong> figure parmi
            les séries acceptées
            {acceptedSeries && acceptedSeries.length > 0
              ? ` (${acceptedSeries.join(", ")})`
              : ""}
            {minAverage !== null ? (
              <>
                , et parce que votre moyenne de{" "}
                <strong className="text-foreground">{average}/20</strong>{" "}
                atteint le seuil enregistré de{" "}
                <strong className="text-foreground">{minAverage}/20</strong>.
              </>
            ) : (
              <>
                . Aucune moyenne minimale n&apos;est enregistrée pour cette
                formation : elle n&apos;a donc pas été écartée sur ce critère,
                mais cela ne garantit pas votre admission.
              </>
            )}
          </p>
          {source && (
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted-dark">
              Seuil issu de : {source.label}
              <ReliabilityTag source={source} />
            </p>
          )}
          <Link
            href={`/formations/${recommendation.id}`}
            className="inline-flex w-fit items-center gap-1.5 rounded text-sm text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
          >
            Voir la fiche complète
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </details>
    </article>
  );
}
