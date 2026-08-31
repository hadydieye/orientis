import type { FieldSpec, FormOption } from "@/components/admin/EntityForm";

export function programFields(departments: FormOption[]): FieldSpec[] {
  return [
    {
      kind: "searchSelect", name: "department_id", label: "Département *", required: true,
      options: departments,
      hint: `${departments.length} départements approuvés, regroupés par établissement.`,
    },
    { kind: "text", name: "name", label: "Nom *", required: true, wide: true },
    { kind: "text", name: "code", label: "Code" },
    {
      kind: "select", name: "level", label: "Niveau *", required: true,
      options: [
        { value: "licence", label: "Licence" },
        { value: "master", label: "Master" },
        { value: "doctorat", label: "Doctorat" },
        { value: "bts", label: "BTS" },
        { value: "autre", label: "Hors LMD" },
      ],
    },
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

export const EMPTY_PROGRAM = {
  department_id: "", name: "", code: "", level: "licence", domain: "",
  specialty: "", duration_years: "", degree_awarded: "", language: "fr",
  description: "", curriculum: "", career_prospects: "", further_studies: "",
};
