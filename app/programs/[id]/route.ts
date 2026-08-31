import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { makeUpdateHandler, makeDeleteHandler } from "@/lib/api/crud";

// GET /programs/:id — admission_requirements, fees, program_documents, sources joints
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
