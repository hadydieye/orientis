import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/admin";

/**
 * Champs modifiables d'une source. `id` est exclu : on ne réassigne pas
 * l'identifiant auquel des lignes du catalogue sont rattachées.
 */
const FIELDS = ["label", "url", "source_type", "status", "verified_at"] as const;

export type SourcePayload = Partial<Record<(typeof FIELDS)[number], unknown>>;

export function pickSourceFields(body: Record<string, unknown>): SourcePayload {
  const out: SourcePayload = {};
  for (const f of FIELDS) {
    if (f in body) out[f] = body[f] === "" ? null : body[f];
  }
  return out;
}

/**
 * Garde de rôle explicite, en plus de RLS.
 *
 * RLS reste la barrière qui compte, mais sans ce contrôle un non-admin
 * recevrait un 200 avec zéro ligne affectée — un faux succès. On préfère un
 * 403 qui dit ce qui manque.
 */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Authentification requise." }, { status: 401 }) };
  }
  if (!session.isAdmin) {
    return {
      error: NextResponse.json(
        { error: "Réservé aux administrateurs : la création et la modification de sources ne sont pas ouvertes aux contributeurs." },
        { status: 403 }
      ),
    };
  }
  return { session };
}

/**
 * Nombre de lignes qui pointent sur cette source.
 *
 * Doit couvrir TOUTES les tables dont la clé étrangère vers sources est en
 * `on delete restrict` : admission_requirements, fees et institution_sources.
 * En oublier une ramène l'erreur de contrainte brute que ce comptage existe
 * précisément pour éviter.
 */
export async function countSourceReferences(id: string) {
  const supabase = await createClient();
  const [reqs, fees, links] = await Promise.all([
    supabase.from("admission_requirements").select("id", { count: "exact", head: true }).eq("source_id", id),
    supabase.from("fees").select("id", { count: "exact", head: true }).eq("source_id", id),
    supabase.from("institution_sources").select("id", { count: "exact", head: true }).eq("source_id", id),
  ]);
  const admissionRequirements = reqs.count ?? 0;
  const feesCount = fees.count ?? 0;
  const institutions = links.count ?? 0;
  return {
    admissionRequirements,
    fees: feesCount,
    institutions,
    total: admissionRequirements + feesCount + institutions,
  };
}
