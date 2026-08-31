export type CascadeCounts = {
  academicUnits?: number;
  departments?: number;
  programs?: number;
  admissionRequirements?: number;
  fees?: number;
};

const CASCADE_LABEL: Array<[keyof CascadeCounts, string, string]> = [
  ["academicUnits", "unité académique", "unités académiques"],
  ["departments", "département", "départements"],
  ["programs", "formation", "formations"],
  ["admissionRequirements", "condition d'admission", "conditions d'admission"],
  ["fees", "ligne de frais", "lignes de frais"],
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
