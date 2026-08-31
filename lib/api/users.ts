import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminSession } from "@/lib/auth/admin";

export const ROLES = ["admin", "contributeur"] as const;
export type Role = (typeof ROLES)[number];

export type ManagedUser = {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  roles: Role[];
};

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Authentification requise." }, { status: 401 }) };
  }
  if (!session.isAdmin) {
    return {
      error: NextResponse.json(
        { error: "Réservé aux administrateurs." },
        { status: 403 }
      ),
    };
  }
  return { session };
}

/**
 * Liste des comptes avec leurs rôles.
 *
 * auth.users n'est pas exposée par PostgREST : il n'existe aucun chemin RLS
 * vers elle, seule l'API Admin la renvoie. Cette lecture passe donc
 * nécessairement par service_role, derrière la garde de rôle ci-dessus.
 *
 * Les rôles sont lus avec la même clé pour rester cohérents avec cette liste
 * (et parce que select_own_roles ne montrerait que la ligne de l'appelant).
 * Les ÉCRITURES, elles, passent par le client authentifié : c'est RLS qui les
 * autorise, pas la garde du handler.
 */
export async function listUsers(): Promise<ManagedUser[]> {
  const service = createServiceClient();
  const { data, error } = await service.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(error.message);

  const { data: roleRows } = await service.from("user_roles").select("user_id, role");
  const byUser = new Map<string, Role[]>();
  for (const r of roleRows ?? []) {
    const list = byUser.get(r.user_id) ?? [];
    list.push(r.role as Role);
    byUser.set(r.user_id, list);
  }

  return data.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      roles: (byUser.get(u.id) ?? []).sort(),
    }))
    .sort((a, b) => (a.email ?? "").localeCompare(b.email ?? "", "fr"));
}

/** Nombre total de comptes portant le rôle admin. */
export async function countAdmins(): Promise<number> {
  const service = createServiceClient();
  const { count } = await service
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");
  return count ?? 0;
}
