import { matchesInterests } from "@/lib/orientation/interests";

/**
 * Filtrage des recommandations sur les critères d'affinement.
 *
 * Distinction importante avec `lib/orientation/score.ts` : le score PONDÈRE
 * (il classe sans rien écarter), ce module ÉCARTE. Une formation qui ne
 * correspond pas aux critères déclarés ne doit plus apparaître du tout —
 * sinon « affiner » ne veut rien dire, la liste reste la même dans un autre
 * ordre.
 *
 * Les critères se combinent en ET : demander « Conakry » ET « Santé »
 * signifie les deux à la fois, comme n'importe quel filtre. Quand cette
 * intersection est vide, l'appelant doit se rabattre sur la liste complète
 * plutôt que d'afficher un écran vide — voir `explainEmptyResult`.
 *
 * Aucun critère non déclaré n'écarte quoi que ce soit : sans ville, sans
 * intérêt et sans catégorie, la liste passe entière. C'est ce qui garantit
 * qu'une formation ne peut jamais devenir définitivement invisible.
 */

export type RefineCriteria = {
  city: string | null;
  interests: string[];
  categorie: string | null;
};

export type FilterableProgram = {
  /** Villes des établissements qui la proposent — vide si aucun rattachement. */
  institutionCities: string[];
  categorie: string | null;
  /** Intitulé + métiers, normalisé. */
  searchIndex: string;
};

export const EMPTY_CRITERIA: RefineCriteria = {
  city: null,
  interests: [],
  categorie: null,
};

/** true dès qu'au moins un critère est déclaré. */
export function hasActiveCriteria(c: RefineCriteria): boolean {
  return Boolean(c.city) || c.interests.length > 0 || Boolean(c.categorie);
}

/** Détail par critère : sert aussi à expliquer un résultat vide. */
export function matchDetail(p: FilterableProgram, c: RefineCriteria) {
  const cityOk = c.city ? p.institutionCities.includes(c.city) : null;
  const interestOk =
    c.interests.length > 0 ? matchesInterests(p.searchIndex, c.interests) : null;
  const categorieOk = c.categorie ? p.categorie === c.categorie : null;

  return {
    cityOk,
    interestOk,
    categorieOk,
    matches: (cityOk ?? true) && (interestOk ?? true) && (categorieOk ?? true),
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
 * Un message générique laisserait croire à un bug : on compte donc ce que
 * chaque critère aurait retenu seul, et on nomme celui qui vide la liste.
 */
export function explainEmptyResult<T extends FilterableProgram>(
  list: T[],
  c: RefineCriteria
): string {
  const counts: Array<{ label: string; kept: number }> = [];

  if (c.city) {
    counts.push({
      label: `proposées à ${c.city}`,
      kept: list.filter((p) => p.institutionCities.includes(c.city!)).length,
    });
  }
  if (c.interests.length > 0) {
    counts.push({
      label: `correspondant à ${c.interests.join(", ")}`,
      kept: list.filter((p) => matchesInterests(p.searchIndex, c.interests)).length,
    });
  }
  if (c.categorie) {
    counts.push({
      label: `de catégorie « ${c.categorie} »`,
      kept: list.filter((p) => p.categorie === c.categorie).length,
    });
  }

  const blocking = counts.filter((x) => x.kept === 0);
  if (blocking.length > 0) {
    return `Aucune des ${list.length} formations ouvertes à votre profil n'est ${blocking
      .map((x) => x.label)
      .join(", ni ")}.`;
  }

  return `Pris séparément, chaque critère retient des formations (${counts
    .map((x) => `${x.kept} ${x.label}`)
    .join(", ")}), mais aucune ne les remplit tous à la fois.`;
}
