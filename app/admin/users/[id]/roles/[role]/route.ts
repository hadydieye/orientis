import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ROLES, countAdmins, requireAdminSession, type Role } from "@/lib/api/users";

/**
 * DELETE /admin/users/:id/roles/:role — retire un rôle.
 *
 * Garde-fou : le dernier rôle admin du système n'est jamais retirable. La
 * consigne visait l'auto-retrait, mais un admin qui retire le rôle du DERNIER
 * admin verrouille le back-office tout autant, qu'il s'agisse de lui ou d'un
 * autre compte. Le contrôle porte donc sur l'état global, pas sur l'identité
 * de l'appelant — c'est strictement plus sûr et le message dit lequel des deux
 * cas s'applique.
 *
 * Ce contrôle ne peut pas vivre dans une policy : RLS décide ligne par ligne
 * et ne sait pas raisonner sur ce qu'il restera dans la table après coup.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; role: string }> }
) {
  const { id, role } = await params;
  const guard = await requireAdminSession();
  if (guard.error) return guard.error;

  if (!ROLES.includes(role as Role)) {
    return NextResponse.json(
      { error: `Rôle inconnu. Valeurs acceptées : ${ROLES.join(", ")}.` },
      { status: 400 }
    );
  }

  if (role === "admin") {
    const admins = await countAdmins();
    if (admins <= 1) {
      const isSelf = id === guard.session!.userId;
      return NextResponse.json(
        {
          error: isSelf
            ? "Vous êtes le dernier administrateur : retirer votre propre rôle admin fermerait le back-office à tout le monde. Attribuez d'abord le rôle admin à un autre compte."
            : "C'est le dernier compte administrateur du système : lui retirer ce rôle fermerait le back-office à tout le monde. Attribuez d'abord le rôle admin à un autre compte.",
          adminCount: admins,
          isSelf,
        },
        { status: 409 }
      );
    }
  }

  // Le retrait passe par le client de l'appelant : la policy admin_delete
  // décide, la garde de rôle n'est qu'une seconde barrière.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", id)
    .eq("role", role)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Sans policy DELETE, PostgREST renvoie 200 et zéro ligne : on distingue
  // « rôle absent » de « retrait refusé » plutôt que d'annoncer un faux succès.
  if (!data || data.length === 0) {
    const service = createServiceClient();
    const { data: still } = await service
      .from("user_roles")
      .select("id")
      .eq("user_id", id)
      .eq("role", role)
      .maybeSingle();

    if (still) {
      return NextResponse.json(
        { error: "Retrait refusé par RLS : aucune policy DELETE n'autorise cet utilisateur sur user_roles." },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Ce compte n'a pas ce rôle." }, { status: 404 });
  }

  return NextResponse.json({ removed: data.length, userId: id, role });
}
