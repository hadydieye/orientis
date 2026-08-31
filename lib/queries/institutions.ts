import { createPublicClient } from "@/lib/supabase/public";

export type CatalogInstitution = {
  id: string;
  name: string;
  city: string | null;
  type: string;
  status: string;
  logoUrl: string | null;
  programCount: number;
};

/**
 * Toutes les institutions du catalogue, avec le nombre réel de formations
 * rattachées (institution → academic_units → departments → programs).
 */
export async function getCatalogInstitutions() {
  const supabase = createPublicClient();

  const [institutionRows, programRows] = await Promise.all([
    supabase
      .from("institutions")
      .select("id, name, city, type, status, logo_url")
      .order("name", { ascending: true }),
    supabase
      .from("programs")
      .select("id, departments!inner(academic_units!inner(institution_id))"),
  ]);

  type ProgramRow = {
    departments: { academic_units: { institution_id: string } };
  };

  const counts = new Map<string, number>();
  for (const row of (programRows.data ?? []) as unknown as ProgramRow[]) {
    const id = row.departments.academic_units.institution_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const institutions: CatalogInstitution[] = (institutionRows.data ?? []).map(
    (i) => ({
      id: i.id,
      name: i.name,
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
