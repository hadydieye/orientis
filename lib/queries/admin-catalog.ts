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
};

export async function getAdminAcademicUnits(
  reviewStatus?: string
): Promise<AdminAcademicUnitRow[]> {
  const supabase = await createClient();

  const { data } = await applyStatus(
    supabase
      .from("academic_units")
      .select("id, name, type, review_status, institutions(name)")
      .order("name"),
    reviewStatus
  );

  type Row = {
    id: string; name: string; type: string; review_status: string;
    institutions: { name: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((u) => ({
    id: u.id,
    name: u.name,
    type: u.type,
    institutionName: u.institutions?.name ?? "—",
    reviewStatus: u.review_status,
  }));
}

// =========================================================================
// Formations
// =========================================================================

export type AdminProgramRow = {
  id: string;
  name: string;
  code: string;
  typeDiplome: string | null;
  /** Sigles des établissements qui la proposent, ou « — » si aucun. */
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
      .select(
        `id, name, code, level, type_diplome_enum, review_status,
         program_institutions(institutions(sigle, name))`
      )
      .order("name"),
    reviewStatus
  );

  type Row = {
    id: string; name: string; code: string; level: string;
    type_diplome_enum: string | null; review_status: string;
    program_institutions: Array<{
      institutions: { sigle: string | null; name: string } | null;
    }> | null;
  };

  return ((data ?? []) as unknown as Row[]).map((p) => {
    const sigles = (p.program_institutions ?? [])
      .map((l) => l.institutions?.sigle ?? l.institutions?.name)
      .filter((v): v is string => Boolean(v))
      .sort((a, b) => a.localeCompare(b, "fr"));

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      typeDiplome: p.type_diplome_enum,
      // « — » plutôt qu'une chaîne vide : les 2 cycles préparatoires n'ont
      // aucun établissement, et l'absence doit se lire.
      institutionName: sigles.length > 0 ? sigles.join(", ") : "—",
      level: p.level,
      reviewStatus: p.review_status,
    };
  });
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
    .select("id, name, sigle, city")
    .eq("review_status", "approved")
    .order("name");
  return (data ?? []).map((i) => ({
    value: i.id,
    label: i.sigle ? `${i.sigle} — ${i.name}` : i.name,
    meta: i.city ?? undefined,
  }));
}

/**
 * Liaisons N-N d'une formation, pour pré-remplir le formulaire.
 *
 * Deux requêtes séparées plutôt qu'un select imbriqué : ce sont deux tables
 * indépendantes, et une erreur sur l'une ne doit pas vider l'autre.
 */
export async function getProgramRelations(programId: string): Promise<{
  institutions: string[];
  profils: string[];
}> {
  const supabase = await createClient();
  const [links, profils] = await Promise.all([
    supabase
      .from("program_institutions")
      .select("institution_id")
      .eq("program_id", programId),
    supabase
      .from("program_profils")
      .select("profil")
      .eq("program_id", programId),
  ]);

  return {
    institutions: (links.data ?? []).map((r) => r.institution_id),
    profils: (profils.data ?? []).map((r) => r.profil),
  };
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

export async function getProgramOptions(): Promise<Option[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select(
      "id, name, type_diplome_enum, program_institutions(institutions(sigle, name))"
    )
    .eq("review_status", "approved")
    .order("name");

  type Row = {
    id: string; name: string; type_diplome_enum: string | null;
    program_institutions: Array<{
      institutions: { sigle: string | null; name: string } | null;
    }> | null;
  };
  return ((data ?? []) as unknown as Row[])
    .map((p) => {
      // Une formation peut relever de plusieurs établissements : on groupe sur
      // le premier par ordre alphabétique, pour que l'option reste à une place
      // stable dans la liste.
      const sigles = (p.program_institutions ?? [])
        .map((l) => l.institutions?.sigle ?? l.institutions?.name)
        .filter((v): v is string => Boolean(v))
        .sort((a, b) => a.localeCompare(b, "fr"));
      return {
        value: p.id,
        label: p.name,
        group: sigles[0] ?? "Sans établissement",
        meta: p.type_diplome_enum ?? undefined,
      };
    })
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
  | "programs"
  | "admission_requirements"
  | "fees";

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

/**
 * Compte ce que la suppression emporterait, en suivant les `on delete cascade`
 * réellement déclarés :
 *   institution -> academic_units
 *               -> program_institutions (la liaison, pas la formation)
 *   programs    -> competences / metiers / secteurs -> employeurs
 *               -> admission_requirements + fees + program_institutions
 *
 * Différence importante avec l'ancien modèle : supprimer un établissement
 * n'emporte PLUS les formations. La liaison N-N disparaît, la formation reste —
 * elle peut être proposée par d'autres établissements. Les départements ont
 * disparu du schéma.
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

  const countBy = async (
    t: "academic_units" | "program_institutions" | "admission_requirements"
      | "fees" | "competences" | "metiers" | "secteurs",
    col: string,
    value: string
  ) => {
    const { count } = await supabase
      .from(t)
      .select("*", { count: "exact", head: true })
      .eq(col, value);
    return count ?? 0;
  };

  if (table === "institutions") {
    return {
      academicUnits: await countBy("academic_units", "institution_id", id),
      programInstitutions: await countBy(
        "program_institutions",
        "institution_id",
        id
      ),
    };
  }

  if (table === "programs") {
    return {
      programInstitutions: await countBy("program_institutions", "program_id", id),
      admissionRequirements: await countBy(
        "admission_requirements",
        "program_id",
        id
      ),
      fees: await countBy("fees", "program_id", id),
      competences: await countBy("competences", "program_id", id),
      metiers: await countBy("metiers", "program_id", id),
      secteurs: await countBy("secteurs", "program_id", id),
    };
  }

  // academic_units n'a plus d'enfant depuis la suppression des départements ;
  // admission_requirements et fees sont des feuilles.
  return {};
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
