import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  clientIp,
  parseProfileBody,
  rateLimit,
  readJsonBody,
} from "@/lib/api/profile";

const PROFILE_COOKIE = "orientis_profile_id";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 180,
};

function tooMany(retryAfter: number) {
  return NextResponse.json(
    { error: "Trop de requêtes. Réessaie dans un instant." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

/**
 * POST /profile — crée (ou met à jour) le profil étudiant.
 *
 * Point d'écriture ouvert aux visiteurs anonymes : il contourne RLS avec la
 * clé service_role, parce qu'une ligne `user_id = null` n'appartient à
 * personne et qu'aucune policy ne peut la couvrir. Trois garde-fous en
 * découlent, tous nécessaires avant une exposition publique :
 *
 *  1. taille du corps plafonnée avant parsing ;
 *  2. champs validés et bornés, un à un ;
 *  3. un visiteur qui possède déjà un profil le MET À JOUR au lieu d'en créer
 *     un second — c'était la vraie source de croissance illimitée, chaque
 *     passage dans le parcours d'orientation insérant une ligne de plus.
 *
 * La limitation de débit ne s'applique qu'à la création réelle : mettre à jour
 * son propre profil ne doit pas être bridé.
 */
export async function POST(request: NextRequest) {
  const parsedBody = await readJsonBody(request);
  if ("error" in parsedBody)
    return NextResponse.json({ error: parsedBody.error }, { status: 400 });

  const parsed = parseProfileBody(parsedBody.raw);
  if ("error" in parsed)
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  const values = parsed.values;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Utilisateur connecté : RLS s'applique, la ligne lui est rattachée.
  if (user) {
    const { data: existing } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const query = existing
      ? supabase.from("student_profiles").update(values).eq("id", existing.id)
      : supabase.from("student_profiles").insert({ ...values, user_id: user.id });

    const { data, error } = await query.select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: existing ? 200 : 201 });
  }

  const service = createServiceClient();
  const cookieStore = await cookies();
  const existingId = cookieStore.get(PROFILE_COOKIE)?.value;

  // Visiteur déjà connu : on réutilise sa ligne. Pas de nouvelle insertion,
  // donc pas de limitation de débit à appliquer.
  if (existingId) {
    const { data, error } = await service
      .from("student_profiles")
      .update(values)
      .eq("id", existingId)
      .is("user_id", null)
      .select()
      .maybeSingle();

    if (!error && data) {
      cookieStore.set(PROFILE_COOKIE, data.id, COOKIE_OPTIONS);
      return NextResponse.json(data);
    }
    // Cookie orphelin (ligne purgée, base réinitialisée) : on retombe sur la
    // création, limitation de débit comprise.
  }

  const limit = rateLimit(`profile:${clientIp(request)}`);
  if (!limit.ok) return tooMany(limit.retryAfter);

  const { data, error } = await service
    .from("student_profiles")
    .insert({ ...values, user_id: null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  cookieStore.set(PROFILE_COOKIE, data.id, COOKIE_OPTIONS);
  return NextResponse.json(data, { status: 201 });
}

/** PATCH /profile — met à jour le profil existant (compte ou cookie visiteur). */
export async function PATCH(request: NextRequest) {
  const parsedBody = await readJsonBody(request);
  if ("error" in parsedBody)
    return NextResponse.json({ error: parsedBody.error }, { status: 400 });

  const parsed = parseProfileBody(parsedBody.raw);
  if ("error" in parsed)
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  const values = parsed.values;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data, error } = await supabase
      .from("student_profiles")
      .update(values)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) {
      return NextResponse.json(
        { error: "Profil introuvable pour cet utilisateur." },
        { status: 404 }
      );
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
    .update(values)
    .eq("id", profileId)
    .is("user_id", null)
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  return NextResponse.json(data);
}
