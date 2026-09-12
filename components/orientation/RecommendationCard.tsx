import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Check,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  MapPin,
  Minus,
  X,
} from "lucide-react";
import { GlassBadge } from "@/components/ui/GlassBadge";
import type { Recommendation } from "@/app/(site)/orientation/actions";

import type { ScoreCriterion } from "@/lib/orientation/score";

/** Au-delà, la carte devient une liste de métiers plutôt qu'un aperçu. */
const METIERS_PREVIEW = 4;

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
}: {
  recommendation: Recommendation;
}) {
  const { score, institutions, metiers } = recommendation;

  return (
    <article className="flex flex-col gap-4 rounded-card border border-glass-border bg-glass-1 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold leading-snug">{recommendation.name}</h3>

          {institutions.length === 0 ? (
            <p className="text-sm text-muted-dark">
              Aucun établissement rattaché dans les données officielles
            </p>
          ) : (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              {institutions.map((institution, index) => (
                <span key={institution.id} className="inline-flex items-center gap-2">
                  {index > 0 && <span aria-hidden>·</span>}
                  <Link
                    href={`/etablissements/${institution.id}`}
                    title={institution.name}
                    className="rounded text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {institution.sigle ?? institution.name}
                  </Link>
                  {institution.city && (
                    <span className="inline-flex items-center gap-1 text-muted">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {institution.city}
                    </span>
                  )}
                </span>
              ))}
            </p>
          )}
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
        {recommendation.typeDiplome && (
          <GlassBadge variant="neutral">{recommendation.typeDiplome}</GlassBadge>
        )}
        {recommendation.categorie && (
          <GlassBadge variant="neutral">{recommendation.categorie}</GlassBadge>
        )}
      </div>

      {metiers.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {metiers.slice(0, METIERS_PREVIEW).map((metier, index) => (
            <li
              key={`${index}-${metier}`}
              className="flex items-center gap-1.5 rounded-pill border border-glass-border bg-glass-2 px-2.5 py-1 text-xs text-muted"
            >
              <Briefcase className="h-3 w-3 shrink-0" aria-hidden />
              {metier}
            </li>
          ))}
          {metiers.length > METIERS_PREVIEW && (
            <li className="px-1 py-1 text-xs text-muted-dark">
              +{metiers.length - METIERS_PREVIEW} autre
              {metiers.length - METIERS_PREVIEW > 1 ? "s" : ""}
            </li>
          )}
        </ul>
      )}

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
            Cette formation apparaît parce que le portail officiel la déclare
            ouverte à votre profil d&apos;entrée. Les points ci-dessus ne
            comptent que vos préférences déclarées : aucune condition
            d&apos;admission chiffrée n&apos;est publiée par la source, donc
            aucune n&apos;est affichée ici.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/formations/${recommendation.id}`}
              className="inline-flex w-fit items-center gap-1.5 rounded text-sm text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
            >
              Voir la fiche complète
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            {recommendation.urlSource && (
              <a
                href={recommendation.urlSource}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1.5 rounded text-sm text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
              >
                Fiche officielle
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
          </div>
        </div>
      </details>
    </article>
  );
}
