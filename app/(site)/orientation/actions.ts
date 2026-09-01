"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { computeScore, type Score } from "@/lib/orientation/score";
import { hasLimitedInfo } from "@/lib/programs/completeness";
import type { ProgramSource } from "@/lib/queries/program-detail";

/** Préférences facultatives du profil, prises en compte dans le score. */
export type Preferences = {
  city?: string | null;
  interests?: string[] | null;
};

export type Recommendation = {
  id: string;
  name: string;
  level: string;
  durationYears: number | null;
  institution: { id: string; name: string; city: string | null };
  /** Seuil et séries réellement enregistrés pour cette formation. */
  minAverage: number | null;
  acceptedSeries: string[] | null;
  source: ProgramSource | null;
  domain: string | null;
  /** true si la formation n'a aucun contenu rédactionnel (cf. completeness). */
  limitedInfo: boolean;
  /** Détail du score, recalculé à chaque appel — jamais stocké. */
  score: Score;
};

type RawEnriched = {
  id: string;
  name: string;
  level: string;
  domain: string | null;
  duration_years: number | null;
  description: string | null;
  curriculum: string | null;
  career_prospects: string | null;
  departments: {
    academic_units: {
      institutions: { id: string; name: string; city: string | null };
    };
  };
  admission_requirements: Array<{
    min_average: number | null;
    accepted_series: string[] | null;
    sources: {
      id: string;
      label: string;
      url: string | null;
      source_type: string;
      status: string;
    } | null;
  }>;
};

export async function getRecommendations(
  series: string,
  average: number,
  preferences: Preferences = {}
): Promise<{
  results: Recommendation[];
  error: string | null;
  /** Couverture du champ `domain`, pour l'annoncer dans l'interface. */
  domainCoverage: { withDomain: number; total: number };
}> {
  const supabase = createPublicClient();

  const { data, error } = await supabase.rpc("recommend_programs", {
    p_series: series,
    p_average: average,
  });

  const emptyCoverage = { withDomain: 0, total: 0 };
  if (error) return { results: [], error: error.message, domainCoverage: emptyCoverage };

  const ids = (data ?? []).map((p) => p.id);
  if (ids.length === 0)
    return { results: [], error: null, domainCoverage: emptyCoverage };

  // La RPC renvoie `setof programs` : ni établissement, ni seuil, ni source.
  // On ré-hydrate ce qu'il faut pour afficher la traçabilité sur chaque carte.
  const { data: enriched, error: enrichError } = await supabase
    .from("programs")
    .select(
      `id, name, level, domain, duration_years, description, curriculum, career_prospects,
       departments!inner ( academic_units!inner ( institutions!inner ( id, name, city ) ) ),
       admission_requirements ( min_average, accepted_series, sources ( id, label, url, source_type, status ) )`
    )
    .in("id", ids);

  if (enrichError)
    return { results: [], error: enrichError.message, domainCoverage: emptyCoverage };

  const results: Recommendation[] = (
    (enriched ?? []) as unknown as RawEnriched[]
  ).map((p) => {
    // On retient le seuil qui a effectivement permis le match.
    const matching =
      p.admission_requirements.find(
        (a) =>
          a.accepted_series?.includes(series) &&
          a.min_average !== null &&
          a.min_average <= average
      ) ?? p.admission_requirements[0];

    const institution = p.departments.academic_units.institutions;
    const source = matching?.sources
      ? {
          id: matching.sources.id,
          label: matching.sources.label,
          url: matching.sources.url,
          sourceType: matching.sources.source_type,
          status: matching.sources.status,
        }
      : null;

    return {
      id: p.id,
      name: p.name,
      level: p.level,
      domain: p.domain,
      durationYears: p.duration_years,
      limitedInfo: hasLimitedInfo({
        description: p.description,
        curriculum: p.curriculum,
        careerProspects: p.career_prospects,
      }),
      institution,
      minAverage: matching?.min_average ?? null,
      acceptedSeries: matching?.accepted_series ?? null,
      source,
      // Le score est recalculé à chaque requête à partir des champs affichés
      // juste à côté : il ne peut pas diverger de ce que l'utilisateur lit.
      score: computeScore({
        series,
        average,
        acceptedSeries: matching?.accepted_series ?? null,
        minAverage: matching?.min_average ?? null,
        source,
        institutionCity: institution.city,
        programDomain: p.domain,
        preferredCity: preferences.city ?? null,
        interests: preferences.interests ?? null,
      }),
    };
  });

  // Tri : score décroissant, puis seuil le plus bas, puis nom. À score égal
  // l'ordre reste déterministe, donc reproductible d'un appel à l'autre.
  results.sort(
    (a, b) =>
      b.score.total - a.score.total ||
      (a.minAverage ?? 0) - (b.minAverage ?? 0) ||
      a.name.localeCompare(b.name, "fr")
  );

  return {
    results,
    error: null,
    domainCoverage: {
      withDomain: results.filter((r) => r.domain).length,
      total: results.length,
    },
  };
}
