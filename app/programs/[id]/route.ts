import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { makeUpdateHandler, makeDeleteHandler } from "@/lib/api/crud";

// GET /programs/:id — établissements, profils, compétences, métiers, secteurs
// et employeurs joints, plus les conditions d'admission et frais s'ils ont été
// saisis en back-office.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("programs")
    .select(
      `*,
      program_institutions(institutions(id, name, sigle, city)),
      program_profils(profil),
      competences(ordre, libelle),
      metiers(ordre, libelle),
      secteurs(id, ordre, nom, employeurs(ordre, libelle)),
      admission_requirements(*, academic_year:academic_years(*), source:sources(*)),
      fees(*, academic_year:academic_years(*), source:sources(*)),
      program_documents(*, document:documents(*))`
    )
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH /programs/:id (contributeur propriétaire ou admin) et DELETE (admin).
export const PATCH = makeUpdateHandler("programs");
export const DELETE = makeDeleteHandler("programs");
