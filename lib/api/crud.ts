import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Fabrique de handlers REST pour les tables du catalogue soumises au workflow
 * de contribution (review_status / created_by).
 *
 * L'autorisation reste portée par RLS : contributeur_insert, admin_update,
 * contributeur_update_own_pending, staff_read_all. Les handlers se contentent
 * d'exiger une session, de forcer les champs de workflow, et de traduire les
 * refus en codes HTTP lisibles.
 */
export type CatalogTable =
  | "institutions"
  | "academic_units"
  | "departments"
  | "programs"
  | "admission_requirements"
  | "fees"
  | "institution_photos"
  | "institution_sources";

/** Champs de workflow : jamais pilotés par le corps de la requête. */
const WORKFLOW_FIELDS = ["review_status", "created_by", "id", "created_at"];

function stripWorkflow(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!WORKFLOW_FIELDS.includes(k)) out[k] = v;
  }
  return out;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export function makeListHandler(table: CatalogTable) {
  return async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    // RLS décide de ce qui est visible : un appelant sans rôle ne verra que
    // les lignes 'approved', même s'il demande ?review_status=pending.
    let query = supabase.from(table).select("*");

    const reviewStatus = searchParams.get("review_status");
    if (reviewStatus) query = query.eq("review_status", reviewStatus);

    for (const [key, value] of searchParams.entries()) {
      if (key === "review_status" || key === "limit") continue;
      query = query.eq(key, value);
    }

    const limit = Number(searchParams.get("limit"));
    if (Number.isFinite(limit) && limit > 0) query = query.limit(limit);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  };
}

export function makeGetOneHandler(table: CatalogTable) {
  return async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
    return NextResponse.json(data);
  };
}

export function makeCreateHandler(table: CatalogTable) {
  return async function POST(request: NextRequest) {
    const { supabase, user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const body = await request.json();
    // La policy contributeur_insert exige exactement ces deux valeurs :
    // on les impose côté serveur plutôt que de faire confiance au client.
    const payload = {
      ...stripWorkflow(body),
      review_status: "pending",
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from(table)
      // Le typage généré n'accepte pas un nom de table dynamique.
      .insert(payload as never)
      .select()
      .single();

    if (error) {
      // 42501 = insufficient_privilege : c'est bien RLS qui refuse.
      // Tout le reste (contrainte CHECK, clé étrangère, colonne manquante)
      // est une erreur de saisie : la renvoyer en 403 ferait croire à un
      // problème de rôle et enverrait le débogage dans la mauvaise direction.
      const denied = error.code === "42501";
      return NextResponse.json(
        {
          error: error.message,
          ...(denied ? { hint: "Le rôle contributeur est-il attribué ?" } : {}),
        },
        { status: denied ? 403 : 400 }
      );
    }
    return NextResponse.json(data, { status: 201 });
  };
}

export function makeUpdateHandler(table: CatalogTable) {
  return async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;
    const { supabase, user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    // review_status n'est pas modifiable ici : passer par approve / reject.
    const body = stripWorkflow(await request.json());

    const { data, error } = await supabase
      .from(table)
      .update(body as never)
      .eq("id", id)
      .select();

    // Deux refus distincts sont possibles ici :
    //  - la ligne n'est pas sélectionnée par le `using` d'une policy UPDATE :
    //    aucune ligne affectée, pas d'erreur -> 404 ;
    //  - elle l'est, mais le résultat viole le `with check` : Postgres lève
    //    42501 -> 403. Renvoyer le message brut exposerait le nom de la table
    //    et la mécanique RLS à l'appelant.
    if (error) {
      if (error.code === "42501") {
        return NextResponse.json(
          { error: "Modification non autorisée sur cette ligne." },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Introuvable ou modification non autorisée." },
        { status: 404 }
      );
    }
    return NextResponse.json(data[0]);
  };
}

export function makeDeleteHandler(table: CatalogTable) {
  return async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;
    const { supabase, user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq("id", id)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Point important : sous RLS, un DELETE non autorisé renvoie 200 en
    // n'affectant AUCUNE ligne. Sans ce contrôle, l'appelant croirait la
    // suppression réussie. On distingue donc explicitement les deux cas.
    //
    // Le motif exact n'est pas observable ici : la ligne peut survivre parce
    // que l'appelant n'est pas admin, ou parce qu'aucune policy DELETE
    // n'existe sur la table. Le message ne tranche donc pas entre les deux.
    if (!data || data.length === 0) {
      const { data: still } = await supabase
        .from(table)
        .select("id")
        .eq("id", id)
        .maybeSingle();

      if (still) {
        return NextResponse.json(
          {
            error:
              "Suppression refusée par RLS : la ligne existe mais aucune policy DELETE ne l'autorise pour cet utilisateur (rôle admin requis).",
          },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: "Introuvable." }, { status: 404 });
    }

    revalidatePublic(data[0] as Record<string, unknown>);
    return NextResponse.json({ deleted: data.length, id });
  };
}

/**
 * Purge le cache des pages publiques après une écriture de modération.
 *
 * Les fiches publiques sont pré-générées (`generateStaticParams` +
 * `revalidate = 3600`). Sans purge explicite, approuver une photo ne change
 * rien pour le visiteur pendant une heure : la page servie vient du
 * prerender, pas de la base. Constaté en build de production — photo
 * `approved` en base, absente de la fiche, `x-nextjs-cache: HIT`.
 *
 * La purge est large à dessein. La modération est une action d'administration
 * peu fréquente ; une invalidation partielle qui oublierait une page
 * ramènerait exactement le bug qu'on corrige, pour un gain de performance
 * sans intérêt à cette échelle.
 */
function revalidatePublic(row: Record<string, unknown> | null) {
  const institutionId =
    typeof row?.institution_id === "string" ? row.institution_id : null;

  // Fiche concernée quand on la connaît directement.
  if (institutionId) revalidatePath(`/etablissements/${institutionId}`);

  // Listes et pages d'accueil, dont les compteurs bougent avec le catalogue.
  revalidatePath("/");
  revalidatePath("/explorer");
  revalidatePath("/formations");

  // Les tables du catalogue remontent dans des fiches qu'on ne peut pas
  // déduire sans requête supplémentaire : on purge l'arborescence entière.
  if (!institutionId) revalidatePath("/", "layout");
}

/** approve / reject : seul chemin autorisé pour écrire review_status. */
export function makeModerationHandler(
  table: CatalogTable,
  reviewStatus: "approved" | "rejected"
) {
  return async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;
    const { supabase, user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from(table)
      .update({ review_status: reviewStatus } as never)
      .eq("id", id)
      .select();

    // Un non-admin est sanctionné par le `with check` de
    // contributeur_update_own_pending (42501) : c'est un refus d'autorisation,
    // pas une requête malformée.
    if (error) {
      if (error.code === "42501") {
        return NextResponse.json(
          { error: "Action réservée aux administrateurs." },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Introuvable ou action non autorisée (rôle admin requis)." },
        { status: 404 }
      );
    }

    revalidatePublic(data[0] as Record<string, unknown>);
    return NextResponse.json(data[0]);
  };
}
