import type { FieldSpec, FormOption } from "@/components/admin/EntityForm";

/** Les 3 séries du baccalauréat guinéen retenues par le projet. STE et
 *  « Autre » ont été retirées du parcours d'orientation : on ne les réintroduit
 *  pas ici. */
export const SERIES_OPTIONS: FormOption[] = [
  { value: "SM", label: "SM — Sciences mathématiques" },
  { value: "SE", label: "SE — Sciences expérimentales" },
  { value: "SS", label: "SS — Sciences sociales" },
];

export function admissionFields(
  programs: FormOption[],
  years: FormOption[],
  sources: FormOption[]
): FieldSpec[] {
  return [
    {
      kind: "searchSelect", name: "program_id", label: "Formation *", required: true,
      options: programs,
      hint: `${programs.length} formations approuvées. Une seule ligne par couple formation + année (contrainte d'unicité en base).`,
    },
    {
      kind: "select", name: "academic_year_id", label: "Année académique *", required: true,
      options: years, wide: true,
    },
    {
      kind: "multiselect", name: "accepted_series", label: "Séries acceptées",
      options: SERIES_OPTIONS,
      hint: "Ne rien cocher si le document source ne précise aucune série : NULL signifie « inconnu », pas « toutes ».",
    },
    {
      kind: "number", name: "min_average", label: "Moyenne minimale", min: 0, max: 20, step: "0.01",
      hint: "Laisser vide si aucun seuil fiable n'est connu — la RPC traite NULL comme « pas de seuil connu ».",
    },
    { kind: "number", name: "age_limit", label: "Limite d'âge", min: 0, max: 99, step: "1" },
    {
      kind: "sourceSelect", name: "source_id", label: "Source",
      options: sources,
      hint: "Sources existantes uniquement. Créer une source depuis ce formulaire n'est pas proposé : la traçabilité passe par une saisie dédiée.",
    },
    {
      kind: "textarea", name: "other_conditions", label: "Autres conditions",
      hint: "Pour un seuil non officiel, conserver la mention de prudence déjà utilisée dans le catalogue.",
    },
  ];
}

export const ADMISSION_NUMERIC = ["min_average", "age_limit"];

export const EMPTY_ADMISSION = {
  program_id: "", academic_year_id: "", accepted_series: [] as string[],
  min_average: "", age_limit: "", source_id: "", other_conditions: "",
};
