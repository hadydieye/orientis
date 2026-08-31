import { createClient } from "@/lib/supabase/server";

export type AdminSession = {
  userId: string;
  email: string | null;
  roles: string[];
  isAdmin: boolean;
  isContributeur: boolean;
};

/**
 * Session du back-office. `null` si personne n'est authentifié.
 *
 * Les rôles sont lus avec le client de l'utilisateur : la policy
 * `select_own_roles` ne lui expose que ses propres lignes, ce qui suffit ici
 * et évite d'élever les privilèges juste pour un contrôle d'accès.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (data ?? []).map((r) => r.role);

  return {
    userId: user.id,
    email: user.email ?? null,
    roles,
    isAdmin: roles.includes("admin"),
    isContributeur: roles.includes("contributeur"),
  };
}
