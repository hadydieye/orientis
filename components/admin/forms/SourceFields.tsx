import type { FieldSpec } from "@/components/admin/EntityForm";

/** Valeurs contraintes par les CHECK du schéma initial. */
export function sourceFields(): FieldSpec[] {
  return [
    { kind: "text", name: "label", label: "Libellé *", required: true, wide: true,
      hint: "Ce texte s'affiche sur les fiches publiques à côté des chiffres qu'il justifie." },
    { kind: "url", name: "url", label: "URL", placeholder: "https://", wide: true },
    {
      kind: "select", name: "source_type", label: "Type *", required: true,
      options: [
        { value: "officiel", label: "Officiel — établissement ou ministère" },
        { value: "etudiant", label: "Étudiant — témoignage" },
        { value: "tiers", label: "Tiers — compilation, presse, réseau social" },
      ],
    },
    {
      kind: "select", name: "status", label: "Statut *", required: true,
      options: [
        { value: "verifie", label: "Vérifié" },
        { value: "a_verifier", label: "À vérifier" },
        { value: "obsolete", label: "Obsolète" },
      ],
    },
    { kind: "text", name: "verified_at", label: "Vérifiée le", placeholder: "AAAA-MM-JJ", wide: true,
      hint: "Seule la combinaison officiel + vérifié fait autorité : tout le reste s'affiche « Non-officiel, à vérifier » sur le site public." },
  ];
}

export const EMPTY_SOURCE = {
  label: "", url: "", source_type: "officiel", status: "a_verifier", verified_at: "",
};
