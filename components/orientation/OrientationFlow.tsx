"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { OrientationStepper } from "@/components/orientation/OrientationStepper";
import { RefineProfile } from "@/components/orientation/RefineProfile";
import { RecommendationCard } from "@/components/orientation/RecommendationCard";
import {
  getRecommendations,
  type Recommendation,
} from "@/app/(site)/orientation/actions";
import {
  EMPTY_CRITERIA,
  explainEmptyResult,
  filterRecommendations,
  hasActiveCriteria,
  type RefineCriteria,
} from "@/lib/orientation/filter";
import { PROFIL_LABEL, PROFIL_ORDER, TYPE_DIPLOME_ORDER } from "@/lib/labels";
import { cn } from "@/lib/cn";

/**
 * Les cinq profils d'entrée du baccalauréat guinéen, tels que publiés par
 * ParcourSup Guinée. « FA » = Franco-Arabe : c'est une série à part entière,
 * pas une modalité d'alternance, et elle ne se recoupe avec aucune autre.
 * Un bachelier SS ne voit donc pas les formations réservées SS-FA.
 */
const PROFILS = PROFIL_ORDER.map((value) => ({
  value,
  label: value,
  hint: PROFIL_LABEL[value],
}));

export function OrientationFlow({
  cities,
  categories,
}: {
  cities: string[];
  categories: string[];
}) {
  const [step, setStep] = useState(0);
  const [profil, setProfil] = useState<string | null>(null);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [criteria, setCriteria] = useState<RefineCriteria>(EMPTY_CRITERIA);
  const [filterEnabled, setFilterEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function chooseProfil(value: string) {
    setProfil(value);
    setError(null);

    // Pas de bouton « Suivant » : la sélection déclenche la recherche. Le
    // profil est la seule information requise depuis que les seuils
    // d'admission ont disparu des données.
    startTransition(async () => {
      const res = await getRecommendations(value, {
        city: criteria.city,
        interests: criteria.interests,
        categorie: criteria.categorie,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setResults(res.results);
      setStep(1);

      // Sauvegarde du profil visiteur (cookie httpOnly côté route).
      // Un échec ici ne doit jamais empêcher l'affichage des résultats.
      try {
        await fetch("/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ series: value }),
        });
      } catch {
        // ignoré volontairement
      }
    });
  }

  function restart() {
    setStep(0);
    setProfil(null);
    setResults(null);
    setCriteria(EMPTY_CRITERIA);
    setFilterEnabled(true);
    setError(null);
  }

  /**
   * Applique les critères d'affinement.
   *
   * Deux effets distincts : le serveur recalcule le SCORE avec ces
   * préférences (elles valent des points), et le filtrage ci-dessous ÉCARTE
   * les formations qui n'y répondent pas. Le filtre est fait ici, côté
   * client, pour que le basculement du toggle soit instantané et pour garder
   * la liste complète sous la main en cas de repli.
   */
  function applyPreferences(next: RefineCriteria) {
    if (!profil) return;
    setCriteria(next);
    setFilterEnabled(true);
    startTransition(async () => {
      const res = await getRecommendations(profil, {
        city: next.city,
        interests: next.interests,
        categorie: next.categorie,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setResults(res.results);
    });
  }

  // Liste effectivement affichée + repli quand l'intersection est vide.
  const view = useMemo(() => {
    const all = results ?? [];
    const active = hasActiveCriteria(criteria) && filterEnabled;
    if (!active) return { list: all, filtered: false, fellBack: false, reason: "" };
    const kept = filterRecommendations(all, criteria);
    if (kept.length > 0) return { list: kept, filtered: true, fellBack: false, reason: "" };
    // Jamais d'écran vide : on retombe sur la liste complète en l'annonçant.
    return {
      list: all,
      filtered: false,
      fellBack: true,
      reason: explainEmptyResult(all, criteria),
    };
  }, [results, criteria, filterEnabled]);

  const matchCount = useMemo(
    () =>
      results && hasActiveCriteria(criteria)
        ? filterRecommendations(results, criteria).length
        : null,
    [results, criteria]
  );

  // Regroupement par type de diplôme, dans l'ordre de lecture de référence.
  const groups = useMemo(() => {
    const byType = new Map<string, Recommendation[]>();
    for (const r of view.list) {
      const key = r.typeDiplome ?? "Autre";
      byType.set(key, [...(byType.get(key) ?? []), r]);
    }
    return [...byType.entries()]
      .map(([typeDiplome, list]) => ({ typeDiplome, list }))
      .sort((a, b) => {
        const ia = TYPE_DIPLOME_ORDER.indexOf(
          a.typeDiplome as (typeof TYPE_DIPLOME_ORDER)[number]
        );
        const ib = TYPE_DIPLOME_ORDER.indexOf(
          b.typeDiplome as (typeof TYPE_DIPLOME_ORDER)[number]
        );
        return (
          (ia === -1 ? TYPE_DIPLOME_ORDER.length : ia) -
          (ib === -1 ? TYPE_DIPLOME_ORDER.length : ib)
        );
      });
  }, [view.list]);

  return (
    <div className="flex flex-col gap-10">
      <OrientationStepper current={step} />

      {step === 0 && (
        <section key="step-0" className="animate-step-in flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-xl font-bold sm:text-2xl">
              Quel est ton profil d&apos;entrée&nbsp;?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Sélectionne ta série du baccalauréat pour voir les formations qui
              te sont ouvertes.
            </p>
          </div>

          <div
            className="flex flex-wrap justify-center gap-3"
            role="group"
            aria-label="Choix du profil d'entrée"
          >
            {PROFILS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => chooseProfil(p.value)}
                disabled={pending}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-card border px-5 py-4 outline-none transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60",
                  profil === p.value
                    ? "border-primary/40 bg-primary/20"
                    : "border-glass-border bg-glass-1 hover:border-glass-border-hover"
                )}
              >
                <span className="font-semibold">{p.label}</span>
                <span className="text-xs text-muted">{p.hint}</span>
              </button>
            ))}
          </div>

          <p className="mx-auto max-w-md text-center text-sm leading-relaxed text-muted">
            Les séries Franco-Arabes ouvrent sur des formations qui leur sont
            propres : elles ne se confondent pas avec les séries SE et SS.{" "}
            <Link
              href="/explorer"
              className="rounded text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
            >
              Explore le catalogue librement
            </Link>{" "}
            si tu préfères tout parcourir.
          </p>

          {error && (
            <p className="text-center text-sm text-error" role="alert">
              {error}
            </p>
          )}
        </section>
      )}

      {step === 1 && results && (
        <section key="step-1" className="animate-step-in flex flex-col gap-6">
          {/* Placé AVANT la liste : l'option d'affiner doit se voir avant de
              parcourir les résultats, pas après les avoir tous lus. */}
          {results.length > 0 && (
            <RefineProfile
              cities={cities}
              categories={categories}
              onApply={applyPreferences}
              applying={pending}
              active={criteria}
              filterEnabled={filterEnabled}
              onToggleFilter={setFilterEnabled}
              matchCount={matchCount}
            />
          )}

          {results.length === 0 ? (
            <GlassPanel variant="1" className="px-6 py-12 text-center">
              <SearchX className="mx-auto h-8 w-8 text-muted-dark" aria-hidden />
              <h2 className="mt-4 text-lg font-semibold">
                Aucune formation ne correspond à ce profil
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                Aucune formation référencée n&apos;est ouverte au profil{" "}
                <strong className="text-foreground">
                  {PROFIL_LABEL[profil ?? ""] ?? profil}
                </strong>
                .
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/explorer">
                  <GlassButton variant="primary">
                    Explorer le catalogue librement
                  </GlassButton>
                </Link>
                <GlassButton variant="secondary" onClick={restart}>
                  Changer de profil
                </GlassButton>
              </div>
            </GlassPanel>
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-xl font-bold sm:text-2xl">
                  {view.list.length} formation{view.list.length > 1 ? "s" : ""}{" "}
                  {view.filtered ? "retenue" : "ouverte"}
                  {view.list.length > 1 ? "s" : ""}
                  {view.filtered ? " par tes critères" : " à ton profil"}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {PROFIL_LABEL[profil ?? ""] ?? profil}
                  {view.filtered && results.length > view.list.length
                    ? ` · ${results.length - view.list.length} écartée${results.length - view.list.length > 1 ? "s" : ""} par le filtre`
                    : ""}
                </p>
                <p className="mt-3 text-sm text-muted">
                  Classées par nombre de critères vérifiés — ce n&apos;est pas
                  une chance d&apos;admission.{" "}
                  <Link
                    href="/orientation/score"
                    className="rounded text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Comment calculons-nous ce score&nbsp;?
                  </Link>
                </p>
              </div>

              {/* Repli : l'intersection est vide, on montre la liste complète
                  en disant pourquoi plutôt que de laisser un écran vide. */}
              {view.fellBack && (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-card border border-warning/30 bg-warning/10 p-4"
                >
                  <SearchX className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold">
                      Aucune formation ne correspond à ces critères précis.
                      Voici les résultats sans ce filtre&nbsp;:
                    </p>
                    <p className="text-sm leading-relaxed text-muted">
                      {view.reason}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-10">
                {groups.map((group) => (
                  <div key={group.typeDiplome} className="flex flex-col gap-4">
                    <h3 className="border-b border-glass-border pb-2 font-semibold">
                      {group.typeDiplome}
                      <span className="ml-2 text-sm font-normal text-muted">
                        {group.list.length}
                      </span>
                    </h3>
                    <div className="flex flex-col gap-4">
                      {group.list.map((r) => (
                        <RecommendationCard key={r.id} recommendation={r} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <GlassPanel variant="1" className="p-5 text-center">
                <p className="text-sm text-muted">
                  Les formations proviennent du portail officiel ParcourSup
                  Guinée. Les conditions d&apos;admission chiffrées n&apos;y
                  sont pas publiées : renseigne-toi auprès de
                  l&apos;établissement avant toute démarche.
                </p>
              </GlassPanel>
            </>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1.5 rounded-button px-3 text-sm text-muted outline-none transition-colors duration-150 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Recommencer
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
