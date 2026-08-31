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
