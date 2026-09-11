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
 * Le total se relit ligne par ligne : si le score vaut 3, on peut nommer les
 * trois points.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LA FORMULE
 * ─────────────────────────────────────────────────────────────────────────
 *   +1  Établissement dans la ville souhaitée
 *   +1  Formation correspondant à un centre d'intérêt déclaré
 *   +1  Catégorie de diplôme souhaitée
 *
 * Le profil d'entrée n'est PAS un critère pondéré : c'est un filtre dur, en
 * amont. Une formation fermée à votre série n'apparaît pas du tout, plutôt
 * que d'apparaître avec un point en moins — les séries franco-arabes ne se
 * recoupent pas avec les autres, l'afficher serait trompeur.
 *
 * Ont disparu avec les données 2025 : la série acceptée et le seuil de
 * moyenne (portés par `admission_requirements`, table vidée), et la fiabilité
 * de la source qui les documentait. Les données ParcourSup Guinée 2026 ne
 * publient aucun seuil chiffré ; garder ces critères reviendrait à noter les
 * formations sur une information qui n'existe plus.
 *
 * Le MAXIMUM est adaptatif : un critère qui dépend d'une préférence non
 * déclarée est exclu du total applicable. Sans cela, ne pas remplir un champ
 * facultatif ferait mécaniquement baisser toutes les formations, ce qui
 * punirait l'utilisateur de ne pas avoir répondu.
 */

import { matchedInterests } from "@/lib/orientation/interests";

export type CriterionState = "met" | "unmet" | "unknown" | "not_declared";

export type ScoreCriterion = {
  key: "city" | "interest" | "categorie";
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
  /** Villes des établissements qui proposent la formation (0, 1 ou plusieurs). */
  institutionCities: string[];
  categorie: string | null;
  /** Intitulé + métiers, normalisé — voir lib/orientation/interests. */
  searchIndex: string;
  /** Préférences déclarées ; absentes => critères non applicables. */
  preferredCity?: string | null;
  interests?: string[] | null;
  preferredCategorie?: string | null;
};

export function computeScore(input: ScoreInput): Score {
  const criteria: ScoreCriterion[] = [];

  // ── +1 Ville souhaitée ────────────────────────────────────────────────
  // Une formation peut être proposée dans plusieurs villes : elle marque le
  // point dès que l'une d'elles correspond.
  if (input.preferredCity) {
    const met = input.institutionCities.includes(input.preferredCity);
    const known = input.institutionCities.length > 0;
    criteria.push({
      key: "city",
      label: "Ville souhaitée",
      points: met ? 1 : 0,
      maxPoints: 1,
      state: met ? "met" : known ? "unmet" : "unknown",
      detail: met
        ? `Proposée à ${input.preferredCity}, la ville que vous avez indiquée`
        : known
          ? `Proposée à ${input.institutionCities.join(", ")}, pas à ${input.preferredCity}`
          : "Aucun établissement rattaché : la ville n'est pas connue",
    });
  } else {
    criteria.push({
      key: "city",
      label: "Ville souhaitée",
      points: 0,
      maxPoints: 0,
      state: "not_declared",
      detail: "Vous n'avez pas indiqué de ville : ce critère n'est pas compté",
    });
  }

  // ── +1 Centre d'intérêt ───────────────────────────────────────────────
  if (input.interests && input.interests.length > 0) {
    const matched = matchedInterests(input.searchIndex, input.interests);
    const met = matched.length > 0;
    criteria.push({
      key: "interest",
      label: "Correspond à vos centres d'intérêt",
      points: met ? 1 : 0,
      maxPoints: 1,
      state: met ? "met" : "unmet",
      detail: met
        ? `Intitulé ou métiers correspondant à : ${matched.join(", ")}`
        : "Ni l'intitulé ni les métiers ne correspondent à vos intérêts déclarés",
    });
  } else {
    criteria.push({
      key: "interest",
      label: "Correspond à vos centres d'intérêt",
      points: 0,
      maxPoints: 0,
      state: "not_declared",
      detail: "Vous n'avez pas déclaré d'intérêts : ce critère n'est pas compté",
    });
  }

  // ── +1 Catégorie de diplôme souhaitée ─────────────────────────────────
  if (input.preferredCategorie) {
    const met = input.categorie === input.preferredCategorie;
    criteria.push({
      key: "categorie",
      label: "Catégorie de diplôme souhaitée",
      points: met ? 1 : 0,
      maxPoints: 1,
      state: met ? "met" : input.categorie ? "unmet" : "unknown",
      detail: met
        ? `Catégorie « ${input.categorie} », celle que vous avez choisie`
        : input.categorie
          ? `Catégorie « ${input.categorie} », pas « ${input.preferredCategorie} »`
          : "La catégorie de cette formation n'est pas renseignée",
    });
  } else {
    criteria.push({
      key: "categorie",
      label: "Catégorie de diplôme souhaitée",
      points: 0,
      maxPoints: 0,
      state: "not_declared",
      detail: "Vous n'avez pas choisi de catégorie : ce critère n'est pas compté",
    });
  }

  return {
    total: criteria.reduce((n, c) => n + c.points, 0),
    max: criteria.reduce((n, c) => n + c.maxPoints, 0),
    criteria,
  };
}
