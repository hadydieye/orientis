import type { FieldSpec, FormOption } from "@/components/admin/EntityForm";

export function departmentFields(units: FormOption[]): FieldSpec[] {
  return [
    {
      kind: "select", name: "academic_unit_id", label: "Unité académique *", required: true,
      options: units, wide: true,
      hint: `${units.length} unités approuvées, regroupées par établissement.`,
    },
    { kind: "text", name: "name", label: "Nom *", required: true, wide: true },
    { kind: "text", name: "contact", label: "Contact", wide: true },
    { kind: "textarea", name: "description", label: "Description" },
  ];
}

export const EMPTY_DEPARTMENT = {
  academic_unit_id: "", name: "", contact: "", description: "",
};
