"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { computeScore, type Score } from "@/lib/orientation/score";
import { buildSearchIndex } from "@/lib/orientation/interests";

/** Préférences facultatives du profil, prises en compte dans le score. */
export type Preferences = {
  city?: string | null;
  interests?: string[] | null;
  categorie?: string | null;
};

export type RecommendationInstitution = {
  id: string;
  name: string;
  sigle: string | null;
  city: string | null;
};

export type Recommendation = {
  id: string;
  name: string;
  code: string;
  typeDiplome: string | null;
  categorie: string | null;
  urlSource: string | null;
  /** N-N : vide pour les formations sans établissement rattaché. */
  institutions: RecommendationInstitution[];
  institutionCities: string[];
  /** Premiers métiers, pour donner à voir le débouché sur la carte. */
  metiers: string[];
  /** Intitulé + métiers, normalisé — sert au filtre par centre d'intérêt. */
  searchIndex: string;
  /** Détail du score, recalculé à chaque appel — jamais stocké. */
  score: Score;
};

type RawEnriched = {
  id: string;
  name: string;
  code: string;
  type_diplome_enum: string | null;
  categorie: string | null;
  url_source: string | null;
  program_institutions: Array<{
    institutions: {
      id: string;
      name: string;
      sigle: string | null;
      city: string | null;
    } | null;
  }> | null;
  metiers: Array<{ ordre: number; libelle: string }> | null;
};

/**
 * Formations ouvertes à un profil d'entrée, ordonnées par score décroissant.
 *
 * Le profil est un FILTRE DUR, appliqué par la fonction Postgres
 * `recommend_programs(p_profil)` : les séries franco-arabes ne se recoupent
 * pas avec les autres, une formation fermée au profil choisi ne doit pas
 * apparaître, même en bas de liste.
 */
export async function getRecommendations(
  profil: string,
  preferences: Preferences = {}
): Promise<{ results: Recommendation[]; error: string | null }> {
  const supabase = createPublicClient();

  const { data, error } = await supabase.rpc("recommend_programs", {
    p_profil: profil as "SM" | "SE" | "SS" | "SE-FA" | "SS-FA",
  });

  if (error) return { results: [], error: error.message };

  const ids = (data ?? []).map((p) => p.id);
  if (ids.length === 0) return { results: [], error: null };

  // La RPC renvoie `setof programs` : ni établissement, ni métier. On
  // ré-hydrate ce qu'il faut pour afficher et scorer chaque carte.
  const { data: enriched, error: enrichError } = await supabase
    .from("programs")
    .select(
      `id, name, code, type_diplome_enum, categorie, url_source,
       program_institutions ( institutions ( id, name, sigle, city ) ),
       metiers ( ordre, libelle )`
    )
    .in("id", ids);

  if (enrichError) return { results: [], error: enrichError.message };

  const results: Recommendation[] = (
    (enriched ?? []) as unknown as RawEnriched[]
  ).map((p) => {
    const institutions = (p.program_institutions ?? [])
      .map((link) => link.institutions)
      .filter((i): i is RecommendationInstitution => Boolean(i))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));

    const metiers = [...(p.metiers ?? [])]
      .sort((a, b) => a.ordre - b.ordre)
      .map((m) => m.libelle);

    const institutionCities = [
      ...new Set(
        institutions.map((i) => i.city).filter((c): c is string => Boolean(c))
      ),
    ];

    const searchIndex = buildSearchIndex({ name: p.name, metiers });

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      typeDiplome: p.type_diplome_enum,
      categorie: p.categorie,
      urlSource: p.url_source,
      institutions,
      institutionCities,
      metiers,
      searchIndex,
      // Le score est recalculé à chaque requête à partir des champs affichés
      // juste à côté : il ne peut pas diverger de ce que l'utilisateur lit.
      score: computeScore({
        institutionCities,
        categorie: p.categorie,
        searchIndex,
        preferredCity: preferences.city ?? null,
        interests: preferences.interests ?? null,
        preferredCategorie: preferences.categorie ?? null,
      }),
    };
  });

  // Tri : score décroissant puis nom. À score égal l'ordre reste
  // déterministe, donc reproductible d'un appel à l'autre.
  results.sort(
    (a, b) => b.score.total - a.score.total || a.name.localeCompare(b.name, "fr")
  );

  return { results, error: null };
}
