import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { getCascadeCounts, type CascadeTable } from "@/lib/queries/admin-catalog";

const TABLES: CascadeTable[] = [
  "institutions",
  "academic_units",
  "departments",
  "programs",
  "admission_requirements",
  "fees",
];

/**
 * GET /admin/cascade/:table/:id — comptes des lignes qu'une suppression
 * emporterait, lus juste avant confirmation par la modale.
 *
 * Lecture seule et déjà filtrée par RLS ; la garde de rôle évite simplement
 * d'exposer la structure du catalogue non publié à un compte sans rôle.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params;

  if (!TABLES.includes(table as CascadeTable)) {
    return NextResponse.json({ error: "Table inconnue." }, { status: 404 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  if (!session.isAdmin && !session.isContributeur) {
    return NextResponse.json({ error: "Rôle requis." }, { status: 403 });
  }

  return NextResponse.json(await getCascadeCounts(table as CascadeTable, id));
}
