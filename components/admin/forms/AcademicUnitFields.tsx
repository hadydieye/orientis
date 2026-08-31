import type { FieldSpec, FormOption } from "@/components/admin/EntityForm";

export function academicUnitFields(institutions: FormOption[]): FieldSpec[] {
  return [
    {
      kind: "select", name: "institution_id", label: "Établissement *", required: true,
      options: institutions, wide: true,
      hint: `${institutions.length} établissements approuvés. Un établissement encore en attente n'est pas proposé comme parent.`,
    },
    { kind: "text", name: "name", label: "Nom *", required: true, wide: true },
    {
      kind: "select", name: "type", label: "Type *", required: true,
      options: [
        { value: "faculte", label: "Faculté" },
        { value: "institut", label: "Institut" },
        { value: "centre", label: "Centre" },
      ],
    },
    { kind: "text", name: "contact", label: "Contact" },
    { kind: "text", name: "address", label: "Adresse", wide: true },
    { kind: "url", name: "website", label: "Site web", placeholder: "https://", wide: true },
    { kind: "textarea", name: "description", label: "Description" },
  ];
}

export const EMPTY_ACADEMIC_UNIT = {
  institution_id: "", name: "", type: "faculte",
  contact: "", address: "", website: "", description: "",
};
