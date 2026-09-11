export type CascadeCounts = {
  academicUnits?: number;
  programs?: number;
  programInstitutions?: number;
  admissionRequirements?: number;
  fees?: number;
  competences?: number;
  metiers?: number;
  secteurs?: number;
};

const CASCADE_LABEL: Array<[keyof CascadeCounts, string, string]> = [
  ["academicUnits", "unité académique", "unités académiques"],
  // Une liaison, pas une formation : supprimer un établissement détache ses
  // formations, il ne les supprime pas.
  ["programInstitutions", "rattachement de formation", "rattachements de formations"],
  ["programs", "formation", "formations"],
  ["admissionRequirements", "condition d'admission", "conditions d'admission"],
  ["fees", "ligne de frais", "lignes de frais"],
  ["competences", "compétence", "compétences"],
  ["metiers", "métier", "métiers"],
  ["secteurs", "secteur", "secteurs"],
];

/**
 * Énumération lisible de ce qu'une suppression emporterait.
 * `null` quand rien n'est lié — la modale affiche alors un message distinct
 * plutôt qu'une phrase de cascade vide.
 */
export function cascadePhrase(counts: CascadeCounts): string | null {
  const parts = CASCADE_LABEL.flatMap(([key, one, many]) => {
    const n = counts[key];
    if (!n) return [];
    return [`${n} ${n > 1 ? many : one}`];
  });
  if (parts.length === 0) return null;
  const last = parts.pop()!;
  return parts.length ? `${parts.join(", ")} et ${last}` : last;
}
