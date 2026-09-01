"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, SearchX } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
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
import { cn } from "@/lib/cn";

// Seules les séries réellement présentes dans les données sont proposées.
// STE et "Autre" n'apparaissent nulle part dans les séries acceptées en base :
// les proposer mènerait mécaniquement à un résultat vide.
const SERIES = [
  { value: "SM", label: "SM", hint: "Sciences Mathématiques" },
  { value: "SE", label: "SE", hint: "Sciences Expérimentales" },
  { value: "SS", label: "SS", hint: "Sciences Sociales" },
];

export function OrientationFlow({ cities }: { cities: string[] }) {
  const [step, setStep] = useState(0);
  const [series, setSeries] = useState<string | null>(null);
  const [average, setAverage] = useState("");
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [criteria, setCriteria] = useState<RefineCriteria>(EMPTY_CRITERIA);
  const [filterEnabled, setFilterEnabled] = useState(true);
  const [domainCoverage, setDomainCoverage] = useState({ withDomain: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const averageValue = Number(average.replace(",", "."));
  const averageValid =
    average.trim() !== "" &&
    !Number.isNaN(averageValue) &&
    averageValue >= 0 &&
    averageValue <= 20;

  function chooseSeries(value: string) {
    setSeries(value);
    // Pas de bouton "Suivant" : la sélection fait avancer l'étape.
    setStep(1);
  }

  function submit() {
    if (!series || !averageValid) return;
    setError(null);

    startTransition(async () => {
      const res = await getRecommendations(series, averageValue, {
        city: criteria.city,
        interests: criteria.interests,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setResults(res.results);
      setDomainCoverage(res.domainCoverage);
      setStep(2);

      // Sauvegarde du profil visiteur (cookie httpOnly côté route).
      // Un échec ici ne doit jamais empêcher l'affichage des résultats.
      try {
        await fetch("/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ series, average: averageValue }),
        });
      } catch {
        // ignoré volontairement
      }
    });
  }

  function restart() {
    setStep(0);
    setSeries(null);
    setAverage("");
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
    if (!series || !averageValid) return;
    setCriteria(next);
    setFilterEnabled(true);
    startTransition(async () => {
      const res = await getRecommendations(series, averageValue, {
        city: next.city,
        interests: next.interests,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setResults(res.results);
      setDomainCoverage(res.domainCoverage);
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

  return (
    <div className="flex flex-col gap-10">
      <OrientationStepper current={step} />

      {step === 0 && (
        <section key="step-0" className="animate-step-in flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-xl font-bold sm:text-2xl">
              Quelle est ta série au baccalauréat&nbsp;?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Sélectionne ta série pour continuer.
            </p>
          </div>

          <div
            className="flex flex-wrap justify-center gap-3"
            role="group"
            aria-label="Choix de la série"
          >
            {SERIES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => chooseSeries(s.value)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-card border px-5 py-4 outline-none transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary",
                  series === s.value
                    ? "border-primary/40 bg-primary/20"
                    : "border-glass-border bg-glass-1 hover:border-glass-border-hover"
                )}
              >
                <span className="font-semibold">{s.label}</span>
                <span className="text-xs text-muted">{s.hint}</span>
              </button>
            ))}
          </div>

          {/* Sortie explicite pour les profils hors SM/SE/SS, plutôt qu'une
              pill supplémentaire qui ne renverrait jamais de résultat. */}
          <p className="mx-auto max-w-md text-center text-sm leading-relaxed text-muted">
            Ta série n&apos;est pas dans la liste&nbsp;? Les formations
            référencées ne précisent pour l&apos;instant que ces trois séries.{" "}
            <Link
              href="/explorer"
              className="rounded text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
            >
              Explore le catalogue librement
            </Link>{" "}
            en attendant.
          </p>
        </section>
      )}

      {step === 1 && (
        <section key="step-1" className="animate-step-in flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-xl font-bold sm:text-2xl">
              Quelle est ta moyenne au bac&nbsp;?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Série sélectionnée&nbsp;:{" "}
              <strong className="text-foreground">{series}</strong>
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-xs flex-col gap-3">
            <label htmlFor="average" className="sr-only">
              Moyenne sur 20
            </label>
            <GlassInput
              id="average"
              type="number"
              inputMode="decimal"
              min={0}
              max={20}
              step="0.01"
              value={average}
              onChange={(e) => setAverage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && averageValid) submit();
              }}
              placeholder="Ex : 12.5"
              aria-describedby="average-help"
              autoFocus
            />
            <p id="average-help" className="text-center text-xs text-muted-dark">
              Une valeur entre 0 et 20.
            </p>

            {average.trim() !== "" && !averageValid && (
              <p className="text-center text-sm text-error" role="alert">
                Entre une moyenne valide entre 0 et 20.
              </p>
            )}

            {error && (
              <p className="text-center text-sm text-error" role="alert">
                {error}
              </p>
            )}

            <GlassButton
              variant="primary"
              onClick={submit}
              disabled={!averageValid || pending}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {pending ? "Recherche..." : "Voir mes résultats"}
            </GlassButton>

            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex items-center justify-center gap-1.5 rounded-button text-sm text-muted outline-none transition-colors duration-150 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Changer de série
            </button>
          </div>
        </section>
      )}

      {step === 2 && results && (
        <section key="step-2" className="animate-step-in flex flex-col gap-6">
          {/* Placé AVANT la liste : l'option d'affiner doit se voir avant de
              parcourir les résultats, pas après les avoir tous lus. */}
          {results.length > 0 && (
            <RefineProfile
              cities={cities}
              onApply={applyPreferences}
              applying={pending}
              active={criteria}
              filterEnabled={filterEnabled}
              onToggleFilter={setFilterEnabled}
              matchCount={matchCount}
              domainCoverage={domainCoverage}
            />
          )}

          {results.length === 0 ? (
            <GlassPanel variant="1" className="px-6 py-12 text-center">
              <SearchX className="mx-auto h-8 w-8 text-muted-dark" aria-hidden />
              <h2 className="mt-4 text-lg font-semibold">
                Aucune formation ne correspond à ce profil
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                Avec la série <strong className="text-foreground">{series}</strong>{" "}
                et une moyenne de{" "}
                <strong className="text-foreground">{averageValue}/20</strong>,
                aucune formation enregistrée ne remplit les deux critères. Cela
                peut vouloir dire que le seuil est plus élevé, mais aussi que les
                séries acceptées ne sont pas encore renseignées pour beaucoup de
                formations.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/explorer">
                  <GlassButton variant="primary">
                    Explorer le catalogue librement
                  </GlassButton>
                </Link>
                <GlassButton variant="secondary" onClick={restart}>
                  Modifier mon profil
                </GlassButton>
              </div>
            </GlassPanel>
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-xl font-bold sm:text-2xl">
                  {view.list.length} formation{view.list.length > 1 ? "s" : ""}{" "}
                  {view.filtered ? "retenue" : "correspond"}
                  {view.list.length > 1 ? (view.filtered ? "s" : "ent") : ""}
                  {view.filtered ? " par tes critères" : " à ton profil"}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Série {series} · moyenne {averageValue}/20
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

              <div className="flex flex-col gap-4">
                {view.list.map((r) => (
                  <RecommendationCard
                    key={r.id}
                    recommendation={r}
                    series={series!}
                    average={averageValue}
                  />
                ))}
              </div>

              <GlassPanel variant="1" className="p-5 text-center">
                <p className="text-sm text-muted">
                  Les seuils affichés proviennent de sources non officielles.
                  Confirme-les auprès de l&apos;établissement avant toute
                  démarche.
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
