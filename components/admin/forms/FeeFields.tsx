import type { FieldSpec, FormOption } from "@/components/admin/EntityForm";

export function feeFields(
  programs: FormOption[],
  years: FormOption[],
  sources: FormOption[]
): FieldSpec[] {
  return [
    {
      kind: "searchSelect", name: "program_id", label: "Formation *", required: true,
      options: programs, hint: `${programs.length} formations approuvées.`,
    },
    {
      kind: "select", name: "academic_year_id", label: "Année académique *", required: true,
      options: years, wide: true,
    },
    {
      kind: "select", name: "fee_type", label: "Type de frais *", required: true,
      options: [
        { value: "inscription", label: "Inscription" },
        { value: "scolarite", label: "Scolarité" },
        { value: "dossier", label: "Frais de dossier" },
        { value: "concours", label: "Concours" },
        { value: "autre", label: "Autre" },
      ],
    },
    {
      kind: "select", name: "frequency", label: "Fréquence *", required: true,
      options: [
        { value: "unique", label: "Paiement unique" },
        { value: "annuel", label: "Par an" },
        { value: "semestriel", label: "Par semestre" },
        { value: "mensuel", label: "Par mois" },
      ],
    },
    { kind: "number", name: "amount", label: "Montant", min: 0, step: "1" },
    { kind: "text", name: "currency", label: "Devise", placeholder: "GNF" },
    {
      kind: "sourceSelect", name: "source_id", label: "Source", options: sources,
      hint: "Sources existantes uniquement — un montant sans source s'affichera en « Source inconnue » sur le site public.",
    },
    { kind: "textarea", name: "conditions", label: "Conditions" },
  ];
}

export const FEE_NUMERIC = ["amount"];

export const EMPTY_FEE = {
  program_id: "", academic_year_id: "", fee_type: "inscription",
  frequency: "annuel", amount: "", currency: "GNF", source_id: "", conditions: "",
};
