import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Lectures du back-office.
 *
 * Les 6 tables du catalogue sont lues avec le client de l'utilisateur
 * authentifié : la visibilité des lignes 'pending' et 'rejected' est portée
 * par les policies RLS (`select_own_or_admin`, `staff_read_all`). Un
 * utilisateur sans rôle ne verra que les lignes 'approved', même s'il
 * atteignait ce module — la garde du layout n'est plus la seule protection.
 *
 * Seule user_roles reste sur service_role (voir note en bas du fichier).
 */

export type AdminCounts = {
  institutions: number;
  academicUnits: number;
  departments: number;
  programs: number;
  admissionRequirements: number;
  fees: number;
  pendingInstitutions: number;
  /** File d'attente par section, pour ne pas n'annoncer que les établissements. */
  pendingByTable: { key: string; label: string; href: string; count: number }[];
  rolesByName: Record<string, number>;
  /** true tant qu'une lecture du back-office passe encore par service_role. */
  usesServiceRoleFallback: boolean;
};

type CatalogClient = Awaited<ReturnType<typeof createClient>>;

async function countOf(
  supabase: CatalogClient,
  table:
    | "academic_units"
    | "departments"
    | "programs"
    | "admission_requirements"
    | "fees"
) {
  const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const supabase = await createClient();
  const service = createServiceClient();

  const PENDING_SECTIONS = [
    { key: "institutions", label: "Établissements", href: "/admin/institutions" },
    { key: "academic_units", label: "Unités académiques", href: "/admin/unites" },
    { key: "departments", label: "Départements", href: "/admin/departements" },
    { key: "programs", label: "Formations", href: "/admin/formations" },
    { key: "admission_requirements", label: "Conditions d'admission", href: "/admin/admissions" },
    { key: "fees", label: "Frais", href: "/admin/frais" },
  ] as const;

  const [
    institutions,
    academicUnits,
    departments,
    programs,
    admissionRequirements,
    fees,
    roles,
    pendingCounts,
  ] = await Promise.all([
    // RLS : compte ce que l'utilisateur a le droit de voir.
    supabase.from("institutions").select("*", { count: "exact", head: true }),
    // Depuis staff_read_all, ces comptes sont exacts sous la session de
    // l'utilisateur : plus besoin d'élever les privilèges pour les obtenir.
    countOf(supabase, "academic_units"),
    countOf(supabase, "departments"),
    countOf(supabase, "programs"),
    countOf(supabase, "admission_requirements"),
    countOf(supabase, "fees"),
    service.from("user_roles").select("role"),
    Promise.all(
      PENDING_SECTIONS.map(async (s) => {
        const { count } = await supabase
          .from(s.key)
          .select("*", { count: "exact", head: true })
          .eq("review_status", "pending");
        return { ...s, count: count ?? 0 };
      })
    ),
  ]);

  const rolesByName: Record<string, number> = {};
  for (const r of roles.data ?? []) {
    rolesByName[r.role] = (rolesByName[r.role] ?? 0) + 1;
  }

  return {
    institutions: institutions.count ?? 0,
    academicUnits,
    departments,
    programs,
    admissionRequirements,
    fees,
    pendingInstitutions:
      pendingCounts.find((p) => p.key === "institutions")?.count ?? 0,
    pendingByTable: pendingCounts.map((p) => ({ ...p })),
    rolesByName,
    usesServiceRoleFallback: true,
  };
}

export type AdminInstitutionRow = {
  id: string;
  name: string;
  city: string | null;
  type: string;
  status: string;
  reviewStatus: string;
  programCount: number;
};

export async function getAdminInstitutions(
  reviewStatus?: string
): Promise<AdminInstitutionRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("institutions")
    .select("id, name, city, type, status, review_status")
    .order("name");

  if (reviewStatus && reviewStatus !== "tous") {
    query = query.eq("review_status", reviewStatus);
  }

  const { data: rows } = await query;

  // Le comptage des formations passe par programs/departments/academic_units.
  // Depuis staff_read_all, un membre du staff voit aussi les lignes non
  // validées : le compte reflète donc l'arborescence réelle, pending compris,
  // et non le seul contenu publié.
  const { data: programRows } = await supabase
    .from("programs")
    .select("id, departments!inner(academic_units!inner(institution_id))");

  type ProgramRow = { departments: { academic_units: { institution_id: string } } };
  const counts = new Map<string, number>();
  for (const p of (programRows ?? []) as unknown as ProgramRow[]) {
    const id = p.departments.academic_units.institution_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return (rows ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    city: i.city,
    type: i.type,
    status: i.status,
    reviewStatus: i.review_status,
    programCount: counts.get(i.id) ?? 0,
  }));
}

export async function getAdminInstitution(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("institutions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

/**
 * NOTE — ce qui reste sur service_role, et pourquoi.
 *
 * Les 5 tables du catalogue en sont sorties : staff_read_all est appliquée sur
 * chacune, leurs compteurs passent maintenant par la session de l'utilisateur.
 *
 * Reste user_roles : la policy select_own_roles n'expose à chacun que ses
 *    propres lignes. Un admin ne verrait donc qu'un seul rôle — le sien — et
 *    le panneau « Utilisateurs par rôle » mentirait. Une policy de lecture
 *    globale sur user_roles demande de la prudence : has_role() lit
 *    elle-même user_roles, donc l'utiliser dans une policy sur cette table
 *    expose à une récursion. À traiter séparément.
 */
