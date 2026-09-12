/**
 * Centres d'intérêt et leur traduction en mots-clés.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POURQUOI DES MOTS-CLÉS PLUTÔT QU'UN CHAMP DE LA BASE
 * ─────────────────────────────────────────────────────────────────────────
 * Ce critère s'appuyait sur `programs.domain`. Ce champ est vide sur les 200
 * formations ParcourSup 2026 : le critère ne pouvait plus rien matcher.
 *
 * La matière est ailleurs — dans l'intitulé de la formation et surtout dans
 * les 1000 libellés de `metiers`. « Enseignement » en est la démonstration :
 * le mot n'apparaît dans AUCUN intitulé, mais touche 34 formations par leurs
 * métiers. Sans le volet métiers, ce centre d'intérêt serait mort.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CE QUE LES MOTS-CLÉS SONT
 * ─────────────────────────────────────────────────────────────────────────
 * Des RACINES, comparées par inclusion sur du texte normalisé : « sociolog »
 * attrape « sociologie » comme « sociologue ». Ce n'est pas une ontologie,
 * c'est un filet volontairement large — un centre d'intérêt sert à réduire
 * une liste de 200, pas à établir une vérité sur une formation.
 *
 * Couverture mesurée sur les données réelles : 199 formations sur 200 sont
 * touchées par au moins un intérêt. La seule exception est « Diplomatie et
 * Coopération Internationale », qui reste visible dès qu'aucun intérêt n'est
 * coché — voir `matchesInterests`, qui laisse tout passer sur liste vide.
 */

/** Minuscules, sans accents, sans ponctuation, espaces réduits. */
export function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const INTEREST_KEYWORDS: Record<string, string[]> = {
  Santé: [
    "sante", "medecin", "medical", "pharmac", "infirm", "soin", "clinique",
    "hospital", "biomedical", "odontolog", "epidemiolog", "nutrition",
    "sage femme",
  ],
  Ingénierie: [
    "ingenieur", "ingenierie", "genie", "mecanique", "electrique",
    "electronique", "industriel", "maintenance", "conception", "fabrication",
    "automatis", "energetique", "civil",
  ],
  Informatique: [
    "informatique", "numerique", "logiciel", "developpeur", "reseau",
    "donnees", "data", "cyber", "web", "telecom", "systeme d information",
  ],
  "Économie et gestion": [
    "economie", "economique", "gestion", "comptab", "finance", "banque",
    "assurance", "marketing", "commerce", "audit", "management",
    "entrepreneur", "logistique", "statistique",
  ],
  Droit: ["droit", "juridique", "juriste", "notaire", "avocat", "huissier", "justice"],
  "Lettres et langues": [
    "langue", "litterature", "linguistique", "traduction", "interpretation",
    "anglais", "arabe", "lettres", "redacteur",
  ],
  "Sciences sociales": [
    "sociolog", "anthropolog", "psycholog", "politique", "histoire",
    "geograph", "philosoph", "communication", "journalis", "social",
  ],
  Agronomie: [
    "agronom", "agricole", "agro", "elevage", "veterinaire", "peche",
    "aquaculture", "halieutique", "rural", "foresti", "zootechn",
  ],
  Enseignement: [
    "enseign", "professeur", "education", "pedagog", "formateur", "instituteur",
  ],
  "Mines et géologie": [
    "mine", "minier", "geolog", "geomatique", "metallurg", "forage",
    "petrol", "topograph",
  ],
  "Architecture et urbanisme": [
    "architect", "urbanis", "urbain", "patrimoine", "construction",
    "infrastructure", "batiment", "design d espace", "amenagement",
  ],
  "Environnement et climat": [
    "environnement", "climat", "atmosphere", "ecolog", "durable", "hydrolog",
    "eau", "energie renouvelable", "paysager", "pollution", "dechet",
  ],
  "Arts et culture": [
    "art", "cinema", "audiovisuel", "musique", "musicolog", "theatre",
    "dramatique", "culture", "plastique", "patrimoine culturel", "realisation",
  ],
};

export const INTERESTS = Object.keys(INTEREST_KEYWORDS);

/** Texte dans lequel les mots-clés sont cherchés : intitulé + métiers. */
export type InterestSearchable = {
  name: string;
  metiers: string[];
};

/** Index normalisé, calculé une fois par formation plutôt qu'à chaque test. */
export function buildSearchIndex(program: InterestSearchable): string {
  return normalizeText([program.name, ...program.metiers].join(" "));
}

/**
 * true si l'index correspond à au moins un des intérêts déclarés.
 *
 * Liste vide = aucun filtre : tout passe. C'est la règle qui garantit qu'une
 * formation ne peut pas devenir définitivement invisible faute de mot-clé.
 */
export function matchesInterests(index: string, interests: string[]): boolean {
  if (interests.length === 0) return true;
  return interests.some((interest) =>
    (INTEREST_KEYWORDS[interest] ?? []).some((keyword) => index.includes(keyword))
  );
}

/** Les intérêts effectivement touchés par cet index — sert à l'affichage. */
export function matchedInterests(index: string, interests: string[]): string[] {
  return interests.filter((interest) =>
    (INTEREST_KEYWORDS[interest] ?? []).some((keyword) => index.includes(keyword))
  );
}
