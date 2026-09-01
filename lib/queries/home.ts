import { createPublicClient } from "@/lib/supabase/public";

export type HomeStats = {
  institutions: number;
  programs: number;
  institutionsWithVerifiedRequirements: number;
  cities: number;
  /** Institutions sans ville renseignée : comptées, jamais escamotées. */
  institutionsWithoutCity: number;
  /** Somme du découpage par ville — doit égaler `institutions`. */
  mappedInstitutions: number;
};

export type Category = {
  name: string;
  programCount: number;
};

export type CityCount = {
  city: string;
  institutionCount: number;
};

export type PopularInstitution = {
  id: string;
  name: string;
  city: string | null;
  status: string;
  type: string;
  programCount: number;
  logoUrl: string | null;
};

/**
 * Toutes les valeurs proviennent de requêtes réelles. Aucun chiffre en dur.
 */
export async function getHomeData() {
  const supabase = createPublicClient();

  const [
    institutionsCount,
    programsCount,
    citiesRows,
    verifiedRows,
    programUnitRows,
    institutionRows,
  ] = await Promise.all([
    supabase.from("institutions").select("*", { count: "exact", head: true }),
    supabase.from("programs").select("*", { count: "exact", head: true }),
    supabase.from("institutions").select("city"),
    // Un seuil est "vérifié" quand la source qui le documente est elle-même
    // marquée status='verifie'. On remonte jusqu'à l'institution.
    supabase
      .from("admission_requirements")
      .select(
        "id, sources!inner(status), programs!inner(departments!inner(academic_units!inner(institution_id)))"
      )
      .eq("sources.status", "verifie"),
    supabase
      .from("programs")
      .select("id, departments!inner(academic_units!inner(name, institution_id))"),
    supabase
      .from("institutions")
      .select("id, name, city, status, type, logo_url")
      .order("created_at", { ascending: true }),
  ]);

  // Une institution sans ville ne doit PAS disparaître du décompte : le total
  // par ville sommait 15 alors que la base en compte 16, et l'écart était
  // invisible. On la compte à part plutôt que de l'écarter en silence.
  const byCity = new Map<string, number>();
  let withoutCity = 0;
  for (const row of citiesRows.data ?? []) {
    if (row.city) byCity.set(row.city, (byCity.get(row.city) ?? 0) + 1);
    else withoutCity += 1;
  }
  const cityCounts: CityCount[] = [...byCity.entries()]
    .map(([city, institutionCount]) => ({ city, institutionCount }))
    .sort((a, b) => a.city.localeCompare(b.city));

  // Contrôle d'intégrité : la somme du découpage doit égaler le total.
  const mappedInstitutions =
    cityCounts.reduce((n, c) => n + c.institutionCount, 0) + withoutCity;

  type VerifiedRow = {
    programs: { departments: { academic_units: { institution_id: string } } };
  };
  const verifiedInstitutions = new Set(
    ((verifiedRows.data ?? []) as unknown as VerifiedRow[]).map(
      (r) => r.programs.departments.academic_units.institution_id
    )
  );

  type ProgramUnitRow = {
    departments: { academic_units: { name: string; institution_id: string } };
  };
  const programUnits = (programUnitRows.data ?? []) as unknown as ProgramUnitRow[];

  const byCategory = new Map<string, number>();
  const byInstitution = new Map<string, number>();
  for (const row of programUnits) {
    const unit = row.departments.academic_units;
    byCategory.set(unit.name, (byCategory.get(unit.name) ?? 0) + 1);
    byInstitution.set(
      unit.institution_id,
      (byInstitution.get(unit.institution_id) ?? 0) + 1
    );
  }

  const categories: Category[] = [...byCategory.entries()]
    .map(([name, programCount]) => ({ name, programCount }))
    .sort((a, b) => b.programCount - a.programCount || a.name.localeCompare(b.name))
    .slice(0, 5);

  const institutions = institutionRows.data ?? [];
  const popularInstitutions: PopularInstitution[] = institutions
    .map((i) => ({
      id: i.id,
      name: i.name,
      city: i.city,
      logoUrl: i.logo_url,
      status: i.status,
      type: i.type,
      programCount: byInstitution.get(i.id) ?? 0,
    }))
    .sort((a, b) => b.programCount - a.programCount)
    .slice(0, 4);

  const stats: HomeStats = {
    institutions: institutionsCount.count ?? 0,
    programs: programsCount.count ?? 0,
    institutionsWithVerifiedRequirements: verifiedInstitutions.size,
    cities: byCity.size,
    institutionsWithoutCity: withoutCity,
    mappedInstitutions,
  };

  return { stats, categories, popularInstitutions, cityCounts };
}
