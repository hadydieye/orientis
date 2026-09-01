import type { NextRequest } from "next/server";

/**
 * Validation et limitation de débit du profil étudiant.
 *
 * `POST /profile` est le seul point d'écriture ouvert aux visiteurs anonymes,
 * et il contourne RLS avec la clé service_role (une ligne `user_id = null`
 * n'appartient à personne, aucune policy ne peut la couvrir). Sans garde-fou,
 * une URL publique devient une insertion illimitée en base — constaté en test :
 * 5 requêtes sans cookie créaient 5 lignes, avec une ville de 500 caractères.
 */

/** Séries réellement présentes dans les données (cf. SeriesSelector). */
const SERIES = ["SM", "SE", "SS"];

const MAX_CITY = 80;
const MAX_INTERESTS = 20;
const MAX_INTEREST_LEN = 60;
const MAX_SUBJECTS = 30;
const MAX_SUBJECT_LEN = 60;
const MAX_BUDGET = 1_000_000_000;
/** Au-delà, on refuse sans même parser : un profil tient en quelques centaines d'octets. */
export const MAX_BODY_BYTES = 8 * 1024;

export type ProfileFields = {
  series?: string;
  average?: number;
  subject_grades?: Record<string, number>;
  interests?: string[];
  city?: string;
  budget?: number;
};

const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

/**
 * Ne retient que les six champs connus, chacun borné. Tout champ inconnu est
 * ignoré ; tout champ connu mais invalide fait échouer la requête avec son nom,
 * plutôt que d'être écrit tel quel ou silencieusement supprimé.
 */
export function parseProfileBody(
  raw: unknown
): { values: ProfileFields } | { error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { error: "Corps de requête invalide : un objet JSON est attendu." };
  }
  const body = raw as Record<string, unknown>;
  const values: ProfileFields = {};

  if (body.series !== undefined) {
    if (typeof body.series !== "string" || !SERIES.includes(body.series)) {
      return { error: `series doit valoir ${SERIES.join(", ")}.` };
    }
    values.series = body.series;
  }

  if (body.average !== undefined) {
    if (!isNum(body.average) || body.average < 0 || body.average > 20) {
      return { error: "average doit être un nombre entre 0 et 20." };
    }
    values.average = body.average;
  }

  if (body.city !== undefined) {
    if (typeof body.city !== "string" || body.city.length > MAX_CITY) {
      return { error: `city doit être une chaîne d'au plus ${MAX_CITY} caractères.` };
    }
    values.city = body.city.trim();
  }

  if (body.budget !== undefined) {
    if (!isNum(body.budget) || body.budget < 0 || body.budget > MAX_BUDGET) {
      return { error: `budget doit être un nombre entre 0 et ${MAX_BUDGET}.` };
    }
    values.budget = body.budget;
  }

  if (body.interests !== undefined) {
    const list = body.interests;
    if (
      !Array.isArray(list) ||
      list.length > MAX_INTERESTS ||
      list.some((i) => typeof i !== "string" || i.length > MAX_INTEREST_LEN)
    ) {
      return {
        error: `interests doit être un tableau d'au plus ${MAX_INTERESTS} chaînes de ${MAX_INTEREST_LEN} caractères.`,
      };
    }
    values.interests = list as string[];
  }

  if (body.subject_grades !== undefined) {
    const g = body.subject_grades;
    if (typeof g !== "object" || g === null || Array.isArray(g)) {
      return { error: "subject_grades doit être un objet { matière: note }." };
    }
    const entries = Object.entries(g as Record<string, unknown>);
    if (entries.length > MAX_SUBJECTS) {
      return { error: `subject_grades est limité à ${MAX_SUBJECTS} matières.` };
    }
    for (const [k, v] of entries) {
      if (k.length > MAX_SUBJECT_LEN) {
        return { error: `subject_grades : nom de matière trop long (max ${MAX_SUBJECT_LEN}).` };
      }
      if (!isNum(v) || v < 0 || v > 20) {
        return { error: `subject_grades["${k}"] doit être un nombre entre 0 et 20.` };
      }
    }
    values.subject_grades = Object.fromEntries(entries) as Record<string, number>;
  }

  return { values };
}

/**
 * Limitation de débit en mémoire, par IP.
 *
 * LIMITE ASSUMÉE : la mémoire n'est pas partagée entre instances. En
 * déploiement serverless, chaque instance a son propre compteur, donc le
 * plafond réel est plus haut que la valeur annoncée. C'est un frein contre
 * l'abus naïf et les boucles accidentelles, PAS une protection contre une
 * attaque distribuée — celle-ci relève du WAF de l'hébergeur ou d'un store
 * partagé (Redis, Upstash).
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

export function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "inconnue";
}

export function rateLimit(key: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((WINDOW_MS - (now - recent[0])) / 1000) };
  }

  recent.push(now);
  hits.set(key, recent);

  // Purge opportuniste : sans elle, la Map grossit indéfiniment sur un
  // processus de longue durée.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return { ok: true };
}

/** Lit le corps en refusant au-delà de MAX_BODY_BYTES, avant tout parsing. */
export async function readJsonBody(
  request: NextRequest
): Promise<{ raw: unknown } | { error: string }> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return { error: `Corps de requête trop volumineux (max ${MAX_BODY_BYTES} octets).` };
  }
  try {
    return { raw: text ? JSON.parse(text) : {} };
  } catch {
    return { error: "JSON invalide." };
  }
}
