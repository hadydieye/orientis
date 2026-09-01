import { INTEREST_TO_DOMAINS } from "@/lib/orientation/score";

/**
 * Filtrage des recommandations sur les critères d'affinement.
 *
 * Distinction importante avec `lib/orientation/score.ts` : le score PONDÈRE
 * (il classe sans rien écarter), ce module ÉCARTE. Une formation qui ne
 * correspond pas aux critères déclarés ne doit plus apparaître du tout —
 * sinon « affiner » ne veut rien dire, la liste reste la même dans un autre
 * ordre.
 *
 * Les deux critères se combinent en ET : demander « Conakry » ET « Santé »
 * signifie les deux à la fois, comme n'importe quel filtre. Quand cette
 * intersection est vide, l'appelant doit se rabattre sur la liste complète
 * plutôt que d'afficher un écran vide — voir `explainEmptyResult`.
 */

export type RefineCriteria = {
  city: string | null;
  interests: string[];
};

export type FilterableProgram = {
  institution: { city: string | null };
  domain: string | null;
};

export const EMPTY_CRITERIA: RefineCriteria = { city: null, interests: [] };

/** true dès qu'au moins un critère est déclaré. */
export function hasActiveCriteria(c: RefineCriteria): boolean {
  return Boolean(c.city) || c.interests.length > 0;
}

/** Domaines visés par les intérêts cochés, via la table publiée sur /orientation/score. */
export function targetDomains(interests: string[]): Set<string> {
  return new Set(interests.flatMap((i) => INTEREST_TO_DOMAINS[i] ?? []));
}

/** Détail par critère : sert aussi à expliquer un résultat vide. */
export function matchDetail(p: FilterableProgram, c: RefineCriteria) {
  const cityOk = c.city ? p.institution.city === c.city : null;
  const interestOk =
    c.interests.length > 0
      ? Boolean(p.domain && targetDomains(c.interests).has(p.domain))
      : null;
  return {
    cityOk,
    interestOk,
    matches: (cityOk ?? true) && (interestOk ?? true),
  };
}

export function filterRecommendations<T extends FilterableProgram>(
  list: T[],
  c: RefineCriteria
): T[] {
  if (!hasActiveCriteria(c)) return list;
  return list.filter((p) => matchDetail(p, c).matches);
}

/**
 * Pourquoi l'intersection est vide, en nommant le critère fautif.
 *
 * Un message générique laisserait croire à un bug. Le champ `domain` étant
 * renseigné sur une poignée de formations seulement, c'est presque toujours
 * le critère « intérêts » qui vide la liste — le dire évite de faire porter
 * le soupçon au filtre lui-même.
 */
export function explainEmptyResult<T extends FilterableProgram>(
  list: T[],
  c: RefineCriteria
): string {
  const cityOnly = c.city ? list.filter((p) => p.institution.city === c.city).length : null;
  const interestOnly =
    c.interests.length > 0
      ? list.filter((p) => p.domain && targetDomains(c.interests).has(p.domain)).length
      : null;
  const withDomain = list.filter((p) => p.domain).length;

  if (interestOnly === 0 && withDomain === 0) {
    return `Aucune des ${list.length} formations retenues n'a de domaine renseigné : ce critère ne peut donc rien sélectionner pour l'instant.`;
  }
  if (interestOnly === 0 && withDomain < list.length) {
    return `Le domaine n'est renseigné que sur ${withDomain} de ces ${list.length} formations, et aucune ne relève de vos centres d'intérêt.`;
  }
  if (cityOnly === 0) {
    return `Aucune des formations retenues pour votre série et votre moyenne n'est proposée à ${c.city}.`;
  }
  if (cityOnly !== null && interestOnly !== null) {
    return `${cityOnly} formation(s) correspondent à la ville et ${interestOnly} au domaine, mais aucune ne remplit les deux à la fois.`;
  }
  return "Aucune formation ne remplit ces critères parmi celles retenues pour votre série et votre moyenne.";
}
