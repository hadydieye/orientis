import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ROLES, requireAdminSession, type Role } from "@/lib/api/users";

// POST /admin/users/:id/roles — attribue un rôle. Corps : { role }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireAdminSession();
  if (guard.error) return guard.error;

  const { role } = (await request.json()) as { role?: string };
  if (!role || !ROLES.includes(role as Role)) {
    return NextResponse.json(
      { error: `Rôle inconnu. Valeurs acceptées : ${ROLES.join(", ")}.` },
      { status: 400 }
    );
  }

  // Le compte doit exister : sans ce contrôle, un id inventé produirait une
  // violation de clé étrangère brute.
  const service = createServiceClient();
  const { data: target, error: lookupError } = await service.auth.admin.getUserById(id);
  if (lookupError || !target?.user) {
    return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  }

  // Écriture avec le client de l'appelant : c'est la policy admin_insert qui
  // autorise, la garde ci-dessus n'est qu'une seconde barrière.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .insert({ user_id: id, role } as never)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `Ce compte a déjà le rôle ${role}.` },
        { status: 409 }
      );
    }
    if (error.code === "42501") {
      return NextResponse.json(
        { error: "Attribution refusée par RLS : aucune policy INSERT n'autorise cet utilisateur sur user_roles." },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}
