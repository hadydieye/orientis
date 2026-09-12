import { createPublicClient } from "@/lib/supabase/public";

export type CatalogInstitution = {
  id: string;
  name: string;
  sigle: string | null;
  city: string | null;
  type: string;
  status: string;
  logoUrl: string | null;
  programCount: number;
};

/**
 * Toutes les institutions du catalogue, avec le nombre réel de formations
 * rattachées.
 *
 * Le comptage passe par `program_institutions` : la chaîne
 * programs → departments → academic_units → institutions ne renvoie plus rien
 * depuis que `programs.department_id` est nul sur les 200 formations 2026.
 */
export async function getCatalogInstitutions() {
  const supabase = createPublicClient();

  const [institutionRows, linkRows] = await Promise.all([
    supabase
      .from("institutions")
      .select("id, name, sigle, city, type, status, logo_url")
      .order("name", { ascending: true }),
    supabase.from("program_institutions").select("institution_id"),
  ]);

  const counts = new Map<string, number>();
  for (const row of linkRows.data ?? []) {
    counts.set(row.institution_id, (counts.get(row.institution_id) ?? 0) + 1);
  }

  const institutions: CatalogInstitution[] = (institutionRows.data ?? []).map(
    (i) => ({
      id: i.id,
      name: i.name,
      sigle: i.sigle,
      city: i.city,
      type: i.type,
      status: i.status,
      logoUrl: i.logo_url,
      programCount: counts.get(i.id) ?? 0,
    })
  );

  const cities = [
    ...new Set(
      institutions.map((i) => i.city).filter((c): c is string => !!c)
    ),
  ].sort((a, b) => a.localeCompare(b, "fr"));

  return { institutions, cities };
}
