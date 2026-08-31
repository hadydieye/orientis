import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const PROFILE_COOKIE = "orientis_profile_id";

type ProfileBody = {
  series?: string;
  average?: number;
  // Notes par matière ("Mathématiques": 14, ...). Doit rester compatible avec
  // le type Json de Supabase (colonne jsonb) : `unknown` ne l'est pas.
  subject_grades?: Record<string, number>;
  interests?: string[];
  city?: string;
  budget?: number;
};

// POST /profile — crée un profil (utilisateur connecté ou visiteur anonyme via cookie)
export async function POST(request: NextRequest) {
  const body: ProfileBody = await request.json();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data, error } = await supabase
      .from("student_profiles")
      .insert({ ...body, user_id: user.id })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  }

  // Visiteur anonyme : ligne user_id = null (hors périmètre RLS), id renvoyé via cookie httpOnly.
  const service = createServiceClient();
  const { data, error } = await service
    .from("student_profiles")
    .insert({ ...body, user_id: null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const cookieStore = await cookies();
  cookieStore.set(PROFILE_COOKIE, data.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });

  return NextResponse.json(data, { status: 201 });
}

// PATCH /profile — met à jour le profil existant (utilisateur connecté ou cookie visiteur)
export async function PATCH(request: NextRequest) {
  const body: ProfileBody = await request.json();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data, error } = await supabase
      .from("student_profiles")
      .update(body)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: "Profil introuvable pour cet utilisateur." }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  const cookieStore = await cookies();
  const profileId = cookieStore.get(PROFILE_COOKIE)?.value;
  if (!profileId) {
    return NextResponse.json(
      { error: "Aucun profil visiteur trouvé. Appelle POST /profile d'abord." },
      { status: 400 }
    );
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("student_profiles")
    .update(body)
    .eq("id", profileId)
    .is("user_id", null)
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  return NextResponse.json(data);
}
