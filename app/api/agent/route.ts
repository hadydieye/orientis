import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { AGENT_TOOLS, runTool } from "@/lib/agent/tools";

export const runtime = "nodejs";
// Cinq tours d'outils enchaînés peuvent dépasser le défaut de la plateforme.
export const maxDuration = 60;

/** Au-delà, on coupe court et on force une réponse finale sans outils. */
const MAX_TOOL_TURNS = 5;

/** Fenêtre glissante de quotas : 10 requêtes par IP toutes les 10 minutes. */
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 10 * 60 * 1000;

/** Garde-fous d'entrée : la fenêtre de contexte du modèle n'est pas gratuite. */
const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;

/**
 * Compteur en mémoire : horodatages des requêtes récentes, par IP.
 *
 * ATTENTION — ce compteur vit dans le processus. Sur Vercel, chaque instance
 * serverless a le sien : le quota réel est de 10 requêtes par instance, pas
 * par déploiement, et il repart à zéro à chaque démarrage à froid. C'est un
 * frein honnête contre une boucle ou un curl répété, pas une protection
 * contre un attaquant déterminé — celle-là demanderait un store partagé
 * (Upstash, Redis), donc une dépendance.
 */
const hits = new Map<string, number[]>();

/** IP du client derrière le proxy de la plateforme. */
function clientIp(request: Request): string {
  // x-forwarded-for peut lister plusieurs sauts : le premier est le client.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "inconnue";
}

/** true si l'IP a épuisé son quota. Consomme un jeton sinon. */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);

  if (recent.length >= RATE_LIMIT) {
    // On réécrit la liste purgée : sans ça, une IP bloquée garderait
    // indéfiniment ses vieux horodatages.
    hits.set(ip, recent);
    return true;
  }

  recent.push(now);
  hits.set(ip, recent);

  // Purge opportuniste : la Map ne doit pas grandir sans fin sur un processus
  // qui tourne longtemps.
  if (hits.size > 1000) {
    for (const [key, stamps] of hits) {
      if (stamps.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(key);
    }
  }

  return false;
}

const SYSTEM_PROMPT = `Tu es conseiller d'orientation pour les bacheliers guinéens. Tu réponds UNIQUEMENT à partir des outils fournis, qui interrogent le catalogue officiel ParcourSup Guinée 2026 du Ministère de l'Enseignement Supérieur.

Tu n'inventes JAMAIS une formation, un établissement, un métier ou un chiffre. Si l'information n'est pas dans les outils, dis-le franchement.

Tu ne connais pas les frais de scolarité, les conditions d'admission chiffrées ni les procédures d'inscription : ces données ne figurent pas dans le catalogue. Dis-le si on te les demande, ne devine pas.

Les profils du bac guinéen sont SM (Sciences Mathématiques), SE (Sciences Expérimentales), SS (Sciences Sociales), SE-FA et SS-FA (séries franco-arabes). Ces profils sont stricts : une formation ouverte à SS-FA n'est pas ouverte à SS.

Réponses courtes et concrètes, en français. Cite toujours le nom exact des formations et le sigle des établissements. N'utilise jamais de tableau : des listes à puces courtes, lisibles sur un écran de téléphone.`;

/**
 * Groq expose une API compatible OpenAI : le SDK officiel suffit, pointé sur
 * leur baseURL. La clé n'est lue que côté serveur — cette route est le seul
 * point qui la touche.
 */
function createClient() {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.AGENT_MODEL;
  // Le modèle n'est jamais codé en dur : changer AGENT_MODEL dans .env.local
  // et redémarrer suffit si le modèle lâche pendant la démo.
  if (!apiKey || !model) return null;

  return {
    client: new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" }),
    model,
  };
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return Response.json(
      {
        error:
          "Tu as posé beaucoup de questions d'affilée. Patiente une dizaine de minutes avant de réessayer.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(RATE_WINDOW_MS / 1000) },
      }
    );
  }

  const config = createClient();
  if (!config) {
    return Response.json(
      { error: "GROQ_API_KEY et AGENT_MODEL doivent être définis dans .env.local." },
      { status: 500 }
    );
  }
  const { client, model } = config;

  let body: { messages?: Array<{ role: string; content: string }> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps de requête illisible." }, { status: 400 });
  }

  const incoming = (body.messages ?? [])
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
    )
    // On tronque plutôt que de rejeter : un fil trop long est le résultat
    // normal d'une longue conversation, pas une erreur de l'utilisateur.
    .slice(-MAX_MESSAGES)
    .map((m) => ({ ...m, content: m.content.slice(0, MAX_CHARS) }));

  if (incoming.length === 0) {
    return Response.json({ error: "Aucun message fourni." }, { status: 400 });
  }

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...incoming.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  try {
    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const completion = await client.chat.completions.create({
        model,
        messages,
        tools: AGENT_TOOLS,
      });

      const reply = completion.choices[0]?.message;
      if (!reply) break;

      const toolCalls = reply.tool_calls ?? [];
      if (toolCalls.length === 0) {
        return Response.json({ content: reply.content ?? "" });
      }

      messages.push(reply);

      for (const call of toolCalls) {
        // Le SDK v6 type tool_calls comme une union function | custom : seules
        // les fonctions nous concernent.
        if (call.type !== "function") continue;

        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          args = {};
        }

        // runTool ne jette jamais : une panne d'outil redescend au modèle
        // comme un résultat { erreur }, et la conversation continue.
        const result = await runTool(call.function.name, args);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Budget d'outils épuisé : on redemande une réponse, sans outils cette
    // fois, pour garantir du texte plutôt qu'une boucle sans fin.
    const final = await client.chat.completions.create({ model, messages });
    return Response.json({ content: final.choices[0]?.message?.content ?? "" });
  } catch (error) {
    // Le détail (modèle inconnu, quota du fournisseur, clé invalide) reste
    // dans les logs serveur : le renvoyer au navigateur exposerait la
    // configuration de l'agent à n'importe quel visiteur.
    console.error("[agent] échec de la requête au modèle", error);
    return Response.json(
      { error: "Le conseiller est momentanément indisponible. Réessaie dans un instant." },
      { status: 502 }
    );
  }
}
