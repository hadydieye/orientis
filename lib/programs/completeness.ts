/**
 * Complétude éditoriale d'une formation.
 *
 * 64 des 108 formations du catalogue n'ont aucun texte : ni présentation, ni
 * contenu de programme, ni débouchés. Elles restent publiées — les masquer
 * reviendrait à nier qu'elles existent — mais leur état doit être visible,
 * sur la fiche comme dans les listes et les recommandations.
 *
 * Ce module est la SEULE définition de ce qu'est une fiche « limitée ».
 * Trois surfaces l'utilisent (fiche, cartes de liste, carte de
 * recommandation) : sans définition partagée, elles divergeraient au premier
 * ajout de champ.
 *
 * Périmètre volontairement restreint aux trois champs rédactionnels de la
 * table `programs`. Les conditions d'admission, les frais et la procédure
 * viennent d'autres tables et ont leur propre traitement d'absence : les
 * mélanger ici rendrait le critère illisible.
 */

export type ProgramContent = {
  description: string | null;
  curriculum: string | null;
  careerProspects: string | null;
};

const isBlank = (v: string | null | undefined) => !v || v.trim() === "";

/** true quand les trois champs rédactionnels sont vides. */
export function hasLimitedInfo(program: ProgramContent): boolean {
  return (
    isBlank(program.description) &&
    isBlank(program.curriculum) &&
    isBlank(program.careerProspects)
  );
}

/** Libellé unique, repris à l'identique sur les trois surfaces. */
export const LIMITED_INFO_BADGE = "Infos limitées";

export const LIMITED_INFO_TITLE = "Fiche en cours de complétion";

export const LIMITED_INFO_MESSAGE =
  "Les informations disponibles sur cette formation sont encore limitées.";


/**
 * Complétude d'un établissement.
 *
 * Un établissement sans aucune unité académique n'a rien à montrer : pas de
 * faculté, donc pas de département, donc pas de formation. Sa fiche publique
 * se réduit à son en-tête. Même règle que pour les formations : on ne la
 * masque pas, on dit son état.
 *
 * Le critère porte sur la structure, pas sur le texte : un établissement peut
 * avoir une présentation fournie et zéro formation — c'est précisément le cas
 * de l'Université Numérique de Guinée.
 */
export function institutionHasNoStructure(institution: {
  units: unknown[];
  programCount: number;
}): boolean {
  return institution.units.length === 0 || institution.programCount === 0;
}

export const INSTITUTION_INCOMPLETE_TITLE = "Fiche en cours de complétion";

export const INSTITUTION_INCOMPLETE_MESSAGE =
  "Aucune formation n'est encore rattachée à cet établissement dans le catalogue.";
