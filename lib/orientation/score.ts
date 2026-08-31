/**
 * Score de correspondance des recommandations d'orientation.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CE QUE CE SCORE EST, ET CE QU'IL N'EST PAS
 * ─────────────────────────────────────────────────────────────────────────
 * Ce n'est PAS une probabilité d'admission, ni un pourcentage de
 * compatibilité. Aucune donnée en base ne permettrait de calculer une telle
 * valeur : il n'existe ni statistiques d'admission, ni nombre de places, ni
 * historique de candidatures. Un pourcentage serait inventé.
 *
 * C'est un COMPTE DE CRITÈRES VÉRIFIABLES. Chaque point correspond à un fait
 * précis, lisible dans la base, et affiché à l'utilisateur avec son libellé.
 * Le total se relit ligne par ligne : si le score vaut 5, on peut nommer les
 * cinq points.
 *
 * Deux formations peuvent donc être à égalité sans être équivalentes ; le
 * score dit « voici ce qui est confirmé », pas « voici vos chances ».
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LA FORMULE
 * ─────────────────────────────────────────────────────────────────────────
 *   +2  Série explicitement acceptée
 *   +2  Seuil d'admission connu ET atteint
 *   +1  Seuil issu d'une source officielle et vérifiée
 *   +1  Établissement dans la ville souhaitée
 *   +1  Domaine de la formation parmi les intérêts déclarés
 *
 * Le MAXIMUM est adaptatif : un critère qui dépend d'une préférence non
 * déclarée (ville, intérêts) est exclu du total applicable. Sans cela, ne pas
 * remplir un champ facultatif ferait mécaniquement baisser toutes les
 * formations, ce qui punirait l'utilisateur de ne pas avoir répondu.
 *
 * Un critère dont la donnée manque en base (série non renseignée, seuil non
 * communiqué) reste COMPTÉ dans le maximum et rapporte 0 : l'absence
 * d'information est une information, et il faut qu'elle se voie.
 */

export type CriterionState = "met" | "unmet" | "unknown" | "not_declared";

export type ScoreCriterion = {
  key: "series" | "average" | "source" | "city" | "interest";
  label: string;
  /** Points obtenus (0 si non rempli). */
  points: number;
  /** Points que ce critère aurait pu rapporter, 0 s'il ne s'applique pas. */
  maxPoints: number;
  state: CriterionState;
  /** Phrase affichée à l'utilisateur, toujours factuelle. */
  detail: string;
};

export type Score = {
  total: number;
  /** Somme des maxPoints des critères applicables. */
  max: number;
  criteria: ScoreCriterion[];
};

export type ScoreInput = {
  series: string;
  average: number;
  acceptedSeries: string[] | null;
  minAverage: number | null;
  source: { sourceType: string; status: string } | null;
  institutionCity: string | null;
  programDomain: string | null;
  /** Préférences déclarées ; absentes => critères non applicables. */
  preferredCity?: string | null;
  interests?: string[] | null;
};

/**
 * Correspondance intérêt déclaré → valeurs possibles de `programs.domain`.
 *
 * Table explicite et non un rapprochement textuel approximatif : deux libellés
 * qui se ressemblent ne désignent pas forcément la même chose, et une
 * correspondance floue serait invérifiable par l'utilisateur.
 *
 * ATTENTION : `domain` est renseigné sur très peu de formations. Ce critère
 * est donc structurellement peu actif tant que le champ n'est pas complété
 * depuis le back-office. La fonction `interestCriterionCoverage` sert à le
 * dire dans l'interface plutôt qu'à le masquer.
 */
export const INTEREST_TO_DOMAINS: Record<string, string[]> = {
  "Santé": ["Sciences de la vie"],
  "Ingénierie": ["Sciences appliquées"],
  "Informatique": ["Sciences appliquées"],
  "Économie et gestion": [],
  "Droit": [],
  "Lettres et langues": [],
  "Sciences sociales": [],
  "Agronomie": ["Sciences de la vie"],
  "Enseignement": [],
  "Mines et géologie": ["Environnement et énergie"],
};

/** Part des formations sur lesquelles le critère « domaine » peut jouer. */
export function interestCriterionCoverage(programs: Array<{ domain: string | null }>) {
  const withDomain = programs.filter((p) => p.domain).length;
  return { withDomain, total: programs.length };
}

export function computeScore(input: ScoreInput): Score {
  const criteria: ScoreCriterion[] = [];

  // ── +2 Série explicitement acceptée ───────────────────────────────────
  // La RPC laisse passer les formations dont accepted_series est NULL : elles
  // ne sont pas écartées, mais rien ne confirme qu'elles acceptent la série.
  if (input.acceptedSeries && input.acceptedSeries.length > 0) {
    const met = input.acceptedSeries.includes(input.series);
    criteria.push({
      key: "series", label: "Série acceptée",
      points: met ? 2 : 0, maxPoints: 2,
      state: met ? "met" : "unmet",
      detail: met
        ? `${input.series} figure parmi les séries acceptées (${input.acceptedSeries.join(", ")})`
        : `Séries acceptées : ${input.acceptedSeries.join(", ")} — ${input.series} n'en fait pas partie`,
    });
  } else {
    criteria.push({
      key: "series", label: "Série acceptée",
      points: 0, maxPoints: 2, state: "unknown",
      detail: "Aucune série acceptée n'est enregistrée pour cette formation",
    });
  }

  // ── +2 Seuil connu et atteint ─────────────────────────────────────────
  if (input.minAverage !== null) {
    const met = input.average >= input.minAverage;
    criteria.push({
      key: "average", label: "Seuil d'admission atteint",
      points: met ? 2 : 0, maxPoints: 2,
      state: met ? "met" : "unmet",
      detail: met
        ? `Seuil enregistré ${input.minAverage}/20, votre moyenne ${input.average}/20`
        : `Seuil enregistré ${input.minAverage}/20, au-dessus de votre moyenne ${input.average}/20`,
    });
  } else {
    criteria.push({
      key: "average", label: "Seuil d'admission atteint",
      points: 0, maxPoints: 2, state: "unknown",
      detail: "Aucune moyenne minimale n'est enregistrée : rien ne confirme le seuil",
    });
  }

  // ── +1 Source officielle et vérifiée ──────────────────────────────────
  const official =
    input.source?.sourceType === "officiel" && input.source?.status === "verifie";
  criteria.push({
    key: "source", label: "Information de source officielle",
    points: official ? 1 : 0, maxPoints: 1,
    state: official ? "met" : input.source ? "unmet" : "unknown",
    detail: official
      ? "Le seuil provient d'une source officielle vérifiée"
      : input.source
        ? "Le seuil provient d'une source tierce, à confirmer auprès de l'établissement"
        : "Aucune source n'est rattachée à cette information",
  });

  // ── +1 Ville souhaitée ────────────────────────────────────────────────
  if (input.preferredCity) {
    const met = input.institutionCity === input.preferredCity;
    criteria.push({
      key: "city", label: "Ville souhaitée",
      points: met ? 1 : 0, maxPoints: 1,
      state: met ? "met" : input.institutionCity ? "unmet" : "unknown",
      detail: met
        ? `L'établissement est à ${input.institutionCity}, la ville que vous avez indiquée`
        : input.institutionCity
          ? `L'établissement est à ${input.institutionCity}, pas à ${input.preferredCity}`
          : "La ville de l'établissement n'est pas renseignée",
    });
  } else {
    criteria.push({
      key: "city", label: "Ville souhaitée",
      points: 0, maxPoints: 0, state: "not_declared",
      detail: "Vous n'avez pas indiqué de ville : ce critère n'est pas compté",
    });
  }

  // ── +1 Domaine parmi les intérêts déclarés ────────────────────────────
  if (input.interests && input.interests.length > 0) {
    const wanted = new Set(
      input.interests.flatMap((i) => INTEREST_TO_DOMAINS[i] ?? [])
    );
    const met = Boolean(input.programDomain && wanted.has(input.programDomain));
    criteria.push({
      key: "interest", label: "Domaine correspondant à vos intérêts",
      points: met ? 1 : 0, maxPoints: 1,
      state: met ? "met" : input.programDomain ? "unmet" : "unknown",
      detail: met
        ? `Domaine « ${input.programDomain} », qui correspond à vos intérêts`
        : input.programDomain
          ? `Domaine « ${input.programDomain} », hors de vos intérêts déclarés`
          : "Le domaine de cette formation n'est pas renseigné en base",
    });
  } else {
    criteria.push({
      key: "interest", label: "Domaine correspondant à vos intérêts",
      points: 0, maxPoints: 0, state: "not_declared",
      detail: "Vous n'avez pas déclaré d'intérêts : ce critère n'est pas compté",
    });
  }

  return {
    total: criteria.reduce((n, c) => n + c.points, 0),
    max: criteria.reduce((n, c) => n + c.maxPoints, 0),
    criteria,
  };
}
