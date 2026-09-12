import type { FieldSpec, FormOption } from "@/components/admin/EntityForm";
import {
  CATEGORIE_ORDER,
  PROFIL_LABEL,
  PROFIL_ORDER,
  TYPE_DIPLOME_ORDER,
} from "@/lib/labels";

/**
 * Formulaire d'une formation.
 *
 * `department_id` a disparu : les formations ParcourSup n'ont ni faculté ni
 * département, la colonne est nullable et les 116 départements ont été
 * supprimés. Le rattachement se fait désormais aux établissements, en N-N.
 *
 * `numero_source` et `annee_source` restent hors formulaire : ce sont des
 * métadonnées d'import, pas des informations saisies à la main.
 */
export function programFields(institutions: FormOption[]): FieldSpec[] {
  return [
    { kind: "text", name: "name", label: "Intitulé *", required: true, wide: true },
    {
      kind: "text", name: "code", label: "Code *", required: true,
      hint: "Identifiant unique de la formation, ex. LIC-001.",
    },
    {
      kind: "select", name: "type_diplome_enum", label: "Type de diplôme",
      placeholder: "—",
      options: TYPE_DIPLOME_ORDER.map((value) => ({ value, label: value })),
    },
    {
      kind: "select", name: "categorie", label: "Catégorie",
      placeholder: "—",
      options: CATEGORIE_ORDER.map((value) => ({ value, label: value })),
    },
    {
      kind: "multiselect", name: "institutions", label: "Établissements",
      options: institutions,
      hint: `${institutions.length} établissements. Une formation peut être proposée par plusieurs d'entre eux — ou par aucun, comme les cycles préparatoires.`,
    },
    {
      kind: "multiselect", name: "profils", label: "Profils d'entrée",
      options: PROFIL_ORDER.map((value) => ({
        value,
        label: `${value} — ${PROFIL_LABEL[value]}`,
      })),
      hint: "Séries du baccalauréat admises. Les séries Franco-Arabes sont distinctes de SE et SS, elles ne les incluent pas.",
    },
    {
      kind: "select", name: "level", label: "Niveau *", required: true,
      hint: "Regroupement large, distinct du type de diplôme.",
      options: [
        { value: "licence", label: "Licence" },
        { value: "master", label: "Master" },
        { value: "doctorat", label: "Doctorat" },
        { value: "bts", label: "BTS" },
        { value: "autre", label: "Hors LMD" },
      ],
    },
    { kind: "url", name: "url_source", label: "URL de la fiche officielle", wide: true },
    { kind: "text", name: "domain", label: "Domaine" },
    { kind: "text", name: "specialty", label: "Spécialité" },
    {
      kind: "number", name: "duration_years", label: "Durée (années)",
      min: 0, max: 12, step: "0.5",
    },
    { kind: "text", name: "degree_awarded", label: "Diplôme délivré" },
    {
      kind: "select", name: "language", label: "Langue",
      options: [
        { value: "fr", label: "Français" },
        { value: "en", label: "Anglais" },
        { value: "ar", label: "Arabe" },
      ],
    },
    { kind: "textarea", name: "description", label: "Description" },
    { kind: "textarea", name: "curriculum", label: "Programme / maquette" },
    { kind: "textarea", name: "career_prospects", label: "Débouchés" },
    { kind: "textarea", name: "further_studies", label: "Poursuite d'études" },
  ];
}

export const PROGRAM_NUMERIC = ["duration_years"];

/** Champs qui ne sont pas des colonnes de `programs` mais des liaisons N-N. */
export const PROGRAM_RELATIONS = ["institutions", "profils"];

export const PROGRAM_RELATION_PATH = "/programs/{id}/relations";

export const EMPTY_PROGRAM = {
  name: "", code: "", type_diplome_enum: "", categorie: "",
  institutions: [] as string[], profils: [] as string[],
  level: "licence", url_source: "", domain: "", specialty: "",
  duration_years: "", degree_awarded: "", language: "fr",
  description: "", curriculum: "", career_prospects: "", further_studies: "",
};
