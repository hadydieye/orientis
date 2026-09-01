export const LEVEL_LABEL: Record<string, string> = {
  licence: "Licence",
  master: "Master",
  doctorat: "Doctorat",
  bts: "BTS",
  autre: "Hors LMD",
};

export const LANGUAGE_LABEL: Record<string, string> = {
  fr: "Français",
  en: "Anglais",
  ar: "Arabe",
};

export const FEE_TYPE_LABEL: Record<string, string> = {
  inscription: "Inscription",
  scolarite: "Scolarité",
  dossier: "Frais de dossier",
  concours: "Concours",
  autre: "Autre",
};

export const FREQUENCY_LABEL: Record<string, string> = {
  unique: "paiement unique",
  annuel: "par an",
  semestriel: "par semestre",
  mensuel: "par mois",
};

/** Une source ne fait autorité que si elle est officielle ET vérifiée. */
export function isOfficialSource(source: {
  sourceType: string;
  status: string;
}) {
  return source.sourceType === "officiel" && source.status === "verifie";
}

/**
 * Vocabulaire de fiabilité — source unique de vérité.
 *
 * Ces trois libellés sont les SEULS autorisés pour qualifier une source, côté
 * public comme côté back-office. Toute variante rédigée à la main ailleurs
 * (« Tiers · à vérifier », « Non vérifié »…) crée deux vocabulaires pour la
 * même notion et brouille la règle de traçabilité du projet.
 *
 * Le texte explicatif d'une page peut citer ces libellés, mais aucun composant
 * ne doit les réécrire : il passe par ReliabilityTag / ReliabilityBadge, ou à
 * défaut par cette constante.
 */
export const RELIABILITY_LABEL = {
  official: "Officiel · vérifié",
  unofficial: "Non-officiel, à vérifier",
  unknown: "Source inconnue",
} as const;

/** Forme minimale suffisante pour trancher la fiabilité. */
export type ReliabilitySource = { sourceType: string; status: string };

export function reliabilityLabel(source: ReliabilitySource | null) {
  if (!source) return RELIABILITY_LABEL.unknown;
  return isOfficialSource(source)
    ? RELIABILITY_LABEL.official
    : RELIABILITY_LABEL.unofficial;
}


/**
 * Vocabulaire de modération — source unique de vérité.
 *
 * `review_status` est une valeur de base de données (`pending` / `approved` /
 * `rejected`). Elle ne doit jamais atteindre l'écran telle quelle : un
 * contributeur qui lit « pending » sur sa soumission ne sait pas si c'est un
 * état normal ou une erreur.
 *
 * À ne pas confondre avec RELIABILITY_LABEL, qui qualifie une SOURCE
 * (officiel / tiers) et non l'avancement d'une contribution. Les deux
 * cohabitent sur les mêmes écrans, d'où l'importance de ne pas les mélanger.
 */
export const REVIEW_STATUS_LABEL: Record<string, string> = {
  pending: "En attente de validation",
  approved: "Validée",
  rejected: "Rejetée",
};

/** Forme courte, pour les cellules de tableau et les filtres. */
export const REVIEW_STATUS_SHORT: Record<string, string> = {
  pending: "En attente",
  approved: "Validée",
  rejected: "Rejetée",
};

export function reviewStatusLabel(status: string, short = false): string {
  const map = short ? REVIEW_STATUS_SHORT : REVIEW_STATUS_LABEL;
  // Une valeur inconnue est affichée telle quelle plutôt que masquée : mieux
  // vaut un libellé étrange qu'un statut silencieusement escamoté.
  return map[status] ?? status;
}
