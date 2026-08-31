import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

/**
 * Lectures du back-office pour les 5 tables du catalogue autres que
 * institutions.
 *
 * Tout passe par le client de l'utilisateur authentifié : depuis la migration
 * staff_read_all, admin et contributeur voient les lignes 'pending' et
 * 'rejected' de ces 6 tables. Un compte sans rôle n'y verrait que les lignes
 * 'approved' — RLS reste la barrière, pas la garde du layout.
 */

export type ReviewStatus = string;

export type Option = {
  value: string;
  label: string;
  /** Regroupement dans le <optgroup> (établissement, unité...). */
  group?: string;
  /** Texte secondaire affiché à droite de l'option. */
  meta?: string;
};

function applyStatus<T extends { eq: (c: string, v: string) => T }>(
  query: T,
  reviewStatus?: string
) {
  if (reviewStatus && reviewStatus !== "tous") return query.eq("review_status", reviewStatus);
  return query;
}

// =========================================================================
// Unités académiques
// =========================================================================

export type AdminAcademicUnitRow = {
  id: string;
  name: string;
  type: string;
  institutionName: string;
  reviewStatus: string;
  departmentCount: number;
};

export async function getAdminAcademicUnits(
  reviewStatus?: string
): Promise<AdminAcademicUnitRow[]> {
  const supabase = await createClient();

  const { data } = await applyStatus(
    supabase
      .from("academic_units")
      .select("id, name, type, review_status, institutions(name), departments(id)")
      .order("name"),
    reviewStatus
  );

  type Row = {
    id: string; name: string; type: string; review_status: string;
    institutions: { name: string } | null;
    departments: { id: string }[];
  };

  return ((data ?? []) as unknown as Row[]).map((u) => ({
    id: u.id,
    name: u.name,
    type: u.type,
    institutionName: u.institutions?.name ?? "—",
    reviewStatus: u.review_status,
    departmentCount: u.departments.length,
  }));
}

// =========================================================================
// Départements
// =========================================================================

export type AdminDepartmentRow = {
  id: string;
  name: string;
  unitName: string;
  institutionName: string;
  reviewStatus: string;
  programCount: number;
};

export async function getAdminDepartments(
  reviewStatus?: string
): Promise<AdminDepartmentRow[]> {
  const supabase = await createClient();

  const { data } = await applyStatus(
    supabase
      .from("departments")
      .select("id, name, review_status, academic_units(name, institutions(name)), programs(id)")
      .order("name"),
    reviewStatus
  );

  type Row = {
    id: string; name: string; review_status: string;
    academic_units: { name: string; institutions: { name: string } | null } | null;
    programs: { id: string }[];
  };

  return ((data ?? []) as unknown as Row[]).map((d) => ({
    id: d.id,
    name: d.name,
    unitName: d.academic_units?.name ?? "—",
    institutionName: d.academic_units?.institutions?.name ?? "—",
    reviewStatus: d.review_status,
    programCount: d.programs.length,
  }));
}

// =========================================================================
// Formations
// =========================================================================

export type AdminProgramRow = {
  id: string;
  name: string;
  departmentName: string;
  institutionName: string;
  level: string;
  reviewStatus: string;
};

export async function getAdminPrograms(
  reviewStatus?: string
): Promise<AdminProgramRow[]> {
  const supabase = await createClient();

  const { data } = await applyStatus(
    supabase
      .from("programs")
      .select("id, name, level, review_status, departments(name, academic_units(institutions(name)))")
      .order("name"),
    reviewStatus
  );

  type Row = {
    id: string; name: string; level: string; review_status: string;
    departments: {
      name: string;
      academic_units: { institutions: { name: string } | null } | null;
    } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((p) => ({
    id: p.id,
    name: p.name,
    departmentName: p.departments?.name ?? "—",
    institutionName: p.departments?.academic_units?.institutions?.name ?? "—",
    level: p.level,
    reviewStatus: p.review_status,
  }));
}

// =========================================================================
// Conditions d'admission
// =========================================================================

export type AdminAdmissionRow = {
  id: string;
  programName: string;
  acceptedSeries: string[] | null;
  minAverage: number | null;
  reviewStatus: string;
  source: { label: string; sourceType: string; status: string } | null;
  yearLabel: string;
};

export async function getAdminAdmissionRequirements(
  reviewStatus?: string
): Promise<AdminAdmissionRow[]> {
  const supabase = await createClient();

  const { data } = await applyStatus(
    supabase
      .from("admission_requirements")
      .select(
        "id, accepted_series, min_average, review_status, programs(name), academic_years(label), sources(label, source_type, status)"
      ),
    reviewStatus
  );

  type Row = {
    id: string; accepted_series: string[] | null; min_average: number | null;
    review_status: string;
    programs: { name: string } | null;
    academic_years: { label: string } | null;
    sources: { label: string; source_type: string; status: string } | null;
  };

  return ((data ?? []) as unknown as Row[])
    .map((r) => ({
      id: r.id,
      programName: r.programs?.name ?? "—",
      acceptedSeries: r.accepted_series,
      minAverage: r.min_average,
      reviewStatus: r.review_status,
      yearLabel: r.academic_years?.label ?? "—",
      source: r.sources
        ? { label: r.sources.label, sourceType: r.sources.source_type, status: r.sources.status }
        : null,
    }))
    .sort((a, b) => a.programName.localeCompare(b.programName, "fr"));
}

// =========================================================================
// Frais
// =========================================================================

export type AdminFeeRow = {
  id: string;
  programName: string;
  feeType: string;
  amount: number | null;
  currency: string;
  frequency: string;
  reviewStatus: string;
  yearLabel: string;
  source: { label: string; sourceType: string; status: string } | null;
};

export async function getAdminFees(reviewStatus?: string): Promise<AdminFeeRow[]> {
  const supabase = await createClient();

  const { data } = await applyStatus(
    supabase
      .from("fees")
      .select(
        "id, fee_type, amount, currency, frequency, review_status, programs(name), academic_years(label), sources(label, source_type, status)"
      ),
    reviewStatus
  );

  type Row = {
    id: string; fee_type: string; amount: number | null; currency: string;
    frequency: string; review_status: string;
    programs: { name: string } | null;
    academic_years: { label: string } | null;
    sources: { label: string; source_type: string; status: string } | null;
  };

  return ((data ?? []) as unknown as Row[])
    .map((f) => ({
      id: f.id,
      programName: f.programs?.name ?? "—",
      feeType: f.fee_type,
      amount: f.amount,
      currency: f.currency,
      frequency: f.frequency,
      reviewStatus: f.review_status,
      yearLabel: f.academic_years?.label ?? "—",
      source: f.sources
        ? { label: f.sources.label, sourceType: f.sources.source_type, status: f.sources.status }
        : null,
    }))
    .sort((a, b) => a.programName.localeCompare(b.programName, "fr"));
}

// =========================================================================
// Listes d'options pour les formulaires
// =========================================================================

/** Seules les lignes approuvées sont proposées comme parent : on ne rattache
 *  pas une nouvelle contribution à un parent lui-même non validé. */
export async function getInstitutionOptions(): Promise<Option[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("institutions")
    .select("id, name, city")
    .eq("review_status", "approved")
    .order("name");
  return (data ?? []).map((i) => ({
    value: i.id,
    label: i.name,
    meta: i.city ?? undefined,
  }));
}

export async function getAcademicUnitOptions(): Promise<Option[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("academic_units")
    .select("id, name, institutions(name)")
    .eq("review_status", "approved")
    .order("name");

  type Row = { id: string; name: string; institutions: { name: string } | null };
  return ((data ?? []) as unknown as Row[])
    .map((u) => ({
      value: u.id,
      label: u.name,
      group: u.institutions?.name ?? "Sans établissement",
    }))
    .sort((a, b) => a.group.localeCompare(b.group, "fr") || a.label.localeCompare(b.label, "fr"));
}

export async function getDepartmentOptions(): Promise<Option[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("departments")
    .select("id, name, academic_units(name, institutions(name))")
    .eq("review_status", "approved")
    .order("name");

  type Row = {
    id: string; name: string;
    academic_units: { name: string; institutions: { name: string } | null } | null;
  };
  return ((data ?? []) as unknown as Row[])
    .map((d) => ({
      value: d.id,
      label: d.name,
      group: d.academic_units?.institutions?.name ?? "Sans établissement",
      meta: d.academic_units?.name,
    }))
    .sort((a, b) => a.group.localeCompare(b.group, "fr") || a.label.localeCompare(b.label, "fr"));
}

export async function getProgramOptions(): Promise<Option[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("id, name, level, departments(academic_units(institutions(name)))")
    .eq("review_status", "approved")
    .order("name");

  type Row = {
    id: string; name: string; level: string;
    departments: { academic_units: { institutions: { name: string } | null } | null } | null;
  };
  return ((data ?? []) as unknown as Row[])
    .map((p) => ({
      value: p.id,
      label: p.name,
      group: p.departments?.academic_units?.institutions?.name ?? "Sans établissement",
      meta: p.level,
    }))
    .sort((a, b) => a.group.localeCompare(b.group, "fr") || a.label.localeCompare(b.label, "fr"));
}

export async function getAcademicYearOptions(): Promise<Option[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("academic_years")
    .select("id, label, is_current")
    .order("label", { ascending: false });
  return (data ?? []).map((y) => ({
    value: y.id,
    label: y.label,
    meta: y.is_current ? "année en cours" : undefined,
  }));
}

/** `meta` porte la fiabilité, lue telle quelle : le formulaire l'affiche sans
 *  l'interpréter au-delà de la règle officiel+vérifié déjà appliquée ailleurs. */
export async function getSourceOptions(): Promise<Option[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sources")
    .select("id, label, source_type, status")
    .order("label");
  return (data ?? []).map((s) => ({
    value: s.id,
    label: s.label,
    meta: `${s.source_type}/${s.status}`,
  }));
}

// =========================================================================
// Comptes de suppression en cascade
// =========================================================================

export type CascadeTable =
  | "institutions"
  | "academic_units"
  | "departments"
  | "programs"
  | "admission_requirements"
  | "fees";

export type CascadeCounts = {
  academicUnits?: number;
  departments?: number;
  programs?: number;
  admissionRequirements?: number;
  fees?: number;
};

/**
 * Compte ce que la suppression emporterait, en suivant les `on delete cascade`
 * déclarés dans le schéma initial :
 *   institution -> academic_units -> departments -> programs
 *                                                -> admission_requirements + fees
 *
 * Les identifiants sont descendus niveau par niveau plutôt que devinés : les
 * chiffres affichés dans la modale sont donc de vrais comptes, pas une
 * estimation.
 */
export async function getCascadeCounts(
  table: CascadeTable,
  id: string
): Promise<CascadeCounts> {
  const supabase = await createClient();
  type ChildTable = "academic_units" | "departments" | "programs" | "admission_requirements" | "fees";
  const ids = async (t: ChildTable, col: string, parents: string[]) => {
    if (parents.length === 0) return [];
    const { data } = await supabase.from(t).select("id").in(col, parents);
    return (data ?? []).map((r) => r.id as string);
  };

  let unitIds: string[] = [];
  let deptIds: string[] = [];
  let progIds: string[] = [];

  if (table === "institutions") {
    unitIds = await ids("academic_units", "institution_id", [id]);
    deptIds = await ids("departments", "academic_unit_id", unitIds);
    progIds = await ids("programs", "department_id", deptIds);
  } else if (table === "academic_units") {
    deptIds = await ids("departments", "academic_unit_id", [id]);
    progIds = await ids("programs", "department_id", deptIds);
  } else if (table === "departments") {
    progIds = await ids("programs", "department_id", [id]);
  } else if (table === "programs") {
    progIds = [id];
  } else {
    return {};
  }

  const reqs = await ids("admission_requirements", "program_id", progIds);
  const fees = await ids("fees", "program_id", progIds);

  const out: CascadeCounts = {
    admissionRequirements: reqs.length,
    fees: fees.length,
  };
  if (table === "institutions") out.academicUnits = unitIds.length;
  if (table === "institutions" || table === "academic_units") out.departments = deptIds.length;
  if (table !== "programs") out.programs = progIds.length;
  return out;
}

/**
 * Ligne brute pour les formulaires de modification. Renvoie `null` si RLS ne
 * l'expose pas — la page rend alors un 404 plutôt qu'un formulaire vide.
 */
export async function getAdminRow<T extends CascadeTable>(
  table: T,
  id: string
): Promise<Database["public"]["Tables"][T]["Row"] | null> {
  const supabase = await createClient();
  // Le nom de table est un paramètre générique : le typage de PostgREST ne
  // sait plus quelle ligne il renvoie. On passe par une lecture non typée,
  // puis on referme le type sur la table demandée par l'appelant — ce qui
  // rend les noms de colonnes vérifiés côté page.
  const { data } = await supabase
    .from(table as CascadeTable)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as Database["public"]["Tables"][T]["Row"]) ?? null;
}

/** Photos d'un établissement pour le back-office : toutes, y compris pending
 *  (staff_read_all), triées comme sur la fiche publique. */
export async function getAdminInstitutionPhotos(institutionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("institution_photos")
    .select("id, photo_url, caption, storage_path, review_status")
    .eq("institution_id", institutionId)
    .order("sort_order")
    .order("created_at");

  return (data ?? []).map((p) => ({
    id: p.id,
    photoUrl: p.photo_url,
    caption: p.caption,
    storagePath: p.storage_path,
    reviewStatus: p.review_status,
  }));
}

// =========================================================================
// Sources
// =========================================================================

export type AdminSourceRow = {
  id: string;
  label: string;
  url: string | null;
  sourceType: string;
  status: string;
  verifiedAt: string | null;
  admissionRequirements: number;
  fees: number;
  institutions: number;
  total: number;
};

/**
 * Sources avec le nombre de lignes du catalogue qui s'y rattachent.
 *
 * Les compteurs sont calculés en deux requêtes groupées côté application
 * plutôt qu'en N+1 : le nombre de sources est petit, mais une requête par
 * ligne resterait gratuite en bruit et coûteuse à la première croissance.
 */
export async function getAdminSources(): Promise<AdminSourceRow[]> {
  const supabase = await createClient();
  const [{ data: sources }, { data: reqs }, { data: fees }, { data: links }] =
    await Promise.all([
      supabase.from("sources").select("*").order("label"),
      supabase.from("admission_requirements").select("source_id"),
      supabase.from("fees").select("source_id"),
      // institution_sources compte aussi : sa clé étrangère est en
      // `on delete restrict`, elle bloque donc la suppression comme les autres.
      supabase.from("institution_sources").select("source_id"),
    ]);

  const count = (rows: { source_id: string | null }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) {
      if (!r.source_id) continue;
      m.set(r.source_id, (m.get(r.source_id) ?? 0) + 1);
    }
    return m;
  };
  const byReq = count(reqs);
  const byFee = count(fees);
  const byLink = count(links);

  return (sources ?? []).map((s) => {
    const a = byReq.get(s.id) ?? 0;
    const f = byFee.get(s.id) ?? 0;
    const l = byLink.get(s.id) ?? 0;
    return {
      id: s.id,
      label: s.label,
      url: s.url,
      sourceType: s.source_type,
      status: s.status,
      verifiedAt: s.verified_at,
      admissionRequirements: a,
      fees: f,
      institutions: l,
      total: a + f + l,
    };
  });
}

export async function getAdminSource(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("sources").select("*").eq("id", id).maybeSingle();
  return data;
}
