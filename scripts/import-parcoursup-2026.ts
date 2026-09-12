/**
 * Import des 200 formations ParcourSup Guinée 2026.
 *
 *   npm run import:parcoursup
 *
 * Idempotent : les programs sont upsertés sur leur `code`, les tables de
 * liaison sur leur clé primaire composite. Les tables enfants à clé technique
 * (competences, metiers, secteurs, employeurs) n'ont aucune clé naturelle :
 * leurs lignes sont donc remplacées pour les programs importés — supprimées
 * puis réinsérées — ce qui rend une relance sans effet de bord.
 *
 * Les identifiants sont lus dans .env.local, jamais codés en dur.
 *
 * On parle à PostgREST directement plutôt que via @supabase/supabase-js :
 * depuis la 2.112, `createClient` instancie un client realtime qui exige un
 * `WebSocket` natif, donc Node 22+, alors que le projet tourne sous Node 20.
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'

const PROJECT_DIR = process.cwd()
const SOURCE = path.join(PROJECT_DIR, 'data', 'out', 'parcoursup-2026-09-11.json')
const BATCH = 500
const ANNEE_SOURCE = 2026

// ---------------------------------------------------------------------------
// Mapping sigle → nom complet de l'établissement, validé manuellement.
// `null` = sigle volontairement non rattaché : ses liens sont ignorés avec un
// avertissement, et AUCUNE institution n'est créée pour lui.
// ---------------------------------------------------------------------------

const SIGLE_TO_NAME: Record<string, string | null> = {
  UGANC: 'Université Gamal Abdel Nasser de Conakry',
  UGLCS: 'Université Générale Lansana Conté de Sonfonia',
  UJNK: 'Université Julius Nyerere de Kankan',
  UK: 'Université de Kindia',
  UL: 'Université de Labé',
  UZ: "Université de N'Zérékoré",
  UNG: 'Université Numérique de Guinée',
  'ISAV Faranah':
    "Institut Supérieur Agronomique et Vétérinaire Valéry Giscard d'Estaing",
  'ISMG Boké': 'Institut Supérieur des Mines et Géologie de Boké',
  'IST Mamou': 'Institut Supérieur de Technologie de Mamou',
  ISCAEG:
    "Institut Supérieur de Commerce et d'Administration des Entreprises de Guinée",
  ISSEG: "Institut Supérieur des Sciences de l'Éducation de Guinée",
  ISSMV: 'Institut Supérieur des Sciences et de Médecine Vétérinaire de Dalaba',
  ISAU: "Institut Supérieur d'Architecture et d'Urbanisme",
  ISIC: "Institut Supérieur de l'Information et de la Communication",
  ESTH: "École Supérieure du Tourisme et de l'Hôtellerie",
  'ISAMK Dubr.': 'Institut Supérieur des Arts Mory Kanté de Dubréka',
  // CPGE désigne les classes préparatoires en général, pas un établissement.
  CPGE: null,
}

/** Établissement à créer s'il est absent. Valeurs dictées, non déduites. */
const ISAMK = {
  name: 'Institut Supérieur des Arts Mory Kanté de Dubréka',
  sigle: 'ISAMK Dubr.',
  city: 'Dubréka',
  type: 'public',
  status: 'institut',
  website: 'https://isamk.edu.gn',
  review_status: 'approved',
} as const

/**
 * `level` n'accepte que licence | master | doctorat | bts | autre, et aucune
 * valeur de type_diplome ne correspond littéralement. `type_diplome_enum`
 * porte la valeur exacte ; `level` n'est que le seau grossier.
 */
const TYPE_DIPLOME_TO_LEVEL: Record<string, string> = {
  'Licence professionnelle': 'licence',
  'Licence fondamentale': 'licence',
  // Cycle long post-bac conférant le grade de master.
  'Diplôme d’ingénieur': 'master',
  // Seul seau court-cycle disponible : bac+2 technique, équivalent BTS.
  DUT: 'bts',
  // Doctorats d'exercice et diplômes d'État : pas un doctorat de 3e cycle.
  'Diplôme d’État': 'autre',
  'Cycle préparatoire': 'autre',
}

// ---------------------------------------------------------------------------
// Forme du fichier source
// ---------------------------------------------------------------------------

type Secteur2026 = { secteur: string | null; employeurs: string[] }

type Formation2026 = {
  code: string
  categorie: string
  numero_source: number
  intitule: string
  type_diplome: string
  ies_sigles: string[]
  profils_entree: string[]
  competences: string[]
  nb_competences_declare: number | null
  nb_competences_extrait: number | null
  metiers: string[]
  secteurs: Secteur2026[]
  url_source: string | null
}

type Source2026 = {
  formations: Formation2026[]
  formation_institutions: Array<{ formation_code: string; ies_sigle: string }>
  institutions: Array<{ sigle: string }>
}

type Row = Record<string, unknown>

// ---------------------------------------------------------------------------
// Environnement et accès REST
// ---------------------------------------------------------------------------

/** Lecture minimale de .env.local : pas de dépendance supplémentaire. */
async function loadEnvLocal(): Promise<void> {
  const file = path.join(PROJECT_DIR, '.env.local')
  let raw: string
  try {
    raw = await readFile(file, 'utf8')
  } catch {
    throw new Error(`Fichier introuvable : ${file}`)
  }

  for (const line of raw.split('\n')) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
    if (!match || line.trimStart().startsWith('#')) continue

    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[match[1]] === undefined) process.env[match[1]] = value
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`)
  return value
}

let SUPABASE_URL = ''
let HEADERS: Record<string, string> = {}

async function rest(
  pathAndQuery: string,
  init: { method?: string; body?: unknown; prefer?: string } = {},
): Promise<unknown[]> {
  const headers: Record<string, string> = { ...HEADERS }
  if (init.body !== undefined) headers['Content-Type'] = 'application/json'
  if (init.prefer) headers['Prefer'] = init.prefer

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `${init.method ?? 'GET'} ${pathAndQuery} → HTTP ${response.status} ` +
        `${response.statusText}\n${text}`,
    )
  }

  if (!text) return []
  const parsed = JSON.parse(text)
  return Array.isArray(parsed) ? parsed : [parsed]
}

/** Insère/upsert par lots de BATCH et renvoie les lignes représentées. */
async function insertBatched(
  table: string,
  rows: Row[],
  options: { onConflict?: string; returning?: boolean } = {},
): Promise<Row[]> {
  const out: Row[] = []

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const query = options.onConflict
      ? `${table}?on_conflict=${encodeURIComponent(options.onConflict)}`
      : table
    const prefer = [
      options.onConflict ? 'resolution=merge-duplicates' : null,
      options.returning ? 'return=representation' : 'return=minimal',
    ]
      .filter(Boolean)
      .join(',')

    const result = (await rest(query, {
      method: 'POST',
      body: chunk,
      prefer,
    })) as Row[]
    out.push(...result)
  }

  return out
}

/** Lit une table entière, pages de BATCH, tri stable. */
async function selectAll(table: string, select: string, orderBy: string): Promise<Row[]> {
  const rows: Row[] = []
  for (let offset = 0; ; offset += BATCH) {
    const page = (await rest(
      `${table}?select=${select}&order=${orderBy}.asc&limit=${BATCH}&offset=${offset}`,
    )) as Row[]
    rows.push(...page)
    if (page.length < BATCH) return rows
  }
}

function chunkIn(values: string[]): string[][] {
  const out: string[][] = []
  for (let i = 0; i < values.length; i += 100) out.push(values.slice(i, i + 100))
  return out
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  await loadEnvLocal()
  SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL').replace(/\/+$/, '')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  HEADERS = { apikey: key, Authorization: `Bearer ${key}` }

  const src = JSON.parse(await readFile(SOURCE, 'utf8')) as Source2026
  const formations = src.formations
  console.log(`\nSource : ${path.relative(PROJECT_DIR, SOURCE)}`)
  console.log(`${formations.length} formations, ${src.formation_institutions.length} liens\n`)

  // Les deux représentations des liens doivent concorder.
  const liensA = new Set(
    src.formation_institutions.map((l) => `${l.formation_code} ${l.ies_sigle}`),
  )
  const liensB = new Set(
    formations.flatMap((f) => f.ies_sigles.map((s) => `${f.code} ${s}`)),
  )
  if (liensA.size !== liensB.size || [...liensA].some((k) => !liensB.has(k))) {
    throw new Error(
      `formation_institutions (${liensA.size}) et formations[].ies_sigles ` +
        `(${liensB.size}) divergent : source incohérente, import interrompu.`,
    )
  }

  const inserted: Record<string, number> = {}
  const warnings: string[] = []

  // --- 1. institutions : sigles + création d'ISAMK ------------------------
  let institutions = await selectAll('institutions', 'id,name,sigle', 'name')
  const idByName = new Map(institutions.map((i) => [i.name as string, i.id as string]))

  if (!institutions.some((i) => i.sigle === ISAMK.sigle || i.name === ISAMK.name)) {
    const created = await insertBatched('institutions', [{ ...ISAMK }], {
      returning: true,
    })
    idByName.set(ISAMK.name, created[0].id as string)
    inserted['institutions (créées)'] = 1
    console.log(`  institutions : ISAMK créée — ${ISAMK.name}`)
  } else {
    inserted['institutions (créées)'] = 0
    console.log(`  institutions : ISAMK déjà présente, aucune création`)
  }

  let sigleUpdates = 0
  for (const [sigle, name] of Object.entries(SIGLE_TO_NAME)) {
    if (name === null) continue // CPGE : aucun établissement, rien à écrire
    const id = idByName.get(name)
    if (!id) {
      warnings.push(`sigle ${sigle} : aucune institution nommée « ${name} » en base`)
      continue
    }
    // UPDATE de `sigle` uniquement, aucun autre champ touché.
    await rest(`institutions?id=eq.${id}`, {
      method: 'PATCH',
      body: { sigle },
      prefer: 'return=minimal',
    })
    sigleUpdates += 1
  }
  inserted['institutions (sigle renseigné)'] = sigleUpdates

  institutions = await selectAll('institutions', 'id,name,sigle', 'name')
  const idBySigle = new Map(
    institutions.filter((i) => i.sigle).map((i) => [i.sigle as string, i.id as string]),
  )

  // --- 2. programs : upsert sur `code` -----------------------------------
  const unknownLevels = new Set<string>()
  const programRows: Row[] = formations.map((f) => {
    const level = TYPE_DIPLOME_TO_LEVEL[f.type_diplome]
    if (!level) unknownLevels.add(f.type_diplome)

    return {
      name: f.intitule,
      code: f.code,
      categorie: f.categorie,
      type_diplome_enum: f.type_diplome,
      numero_source: f.numero_source,
      url_source: f.url_source,
      annee_source: ANNEE_SOURCE,
      level: level ?? 'autre',
      department_id: null,
      academic_unit_id: null,
      review_status: 'approved',
    }
  })

  if (unknownLevels.size) {
    throw new Error(
      `type_diplome hors table de correspondance : ${[...unknownLevels].join(', ')}`,
    )
  }

  const programs = await insertBatched('programs', programRows, {
    onConflict: 'code',
    returning: true,
  })
  inserted['programs'] = programs.length

  const programIdByCode = new Map(
    programs.map((p) => [p.code as string, p.id as string]),
  )
  const missing = formations.filter((f) => !programIdByCode.has(f.code))
  if (missing.length) {
    throw new Error(
      `${missing.length} formations sans id après upsert : ` +
        missing.slice(0, 5).map((f) => f.code).join(', '),
    )
  }

  const programIds = [...programIdByCode.values()]

  // --- 3. program_institutions -------------------------------------------
  const ignoredBySigle = new Map<string, number>()
  const linkRows: Row[] = []

  for (const link of src.formation_institutions) {
    const institutionId = idBySigle.get(link.ies_sigle)
    if (!institutionId) {
      ignoredBySigle.set(link.ies_sigle, (ignoredBySigle.get(link.ies_sigle) ?? 0) + 1)
      continue
    }
    linkRows.push({
      program_id: programIdByCode.get(link.formation_code),
      institution_id: institutionId,
    })
  }

  await insertBatched('program_institutions', linkRows, {
    onConflict: 'program_id,institution_id',
  })
  inserted['program_institutions'] = linkRows.length

  // --- 4. program_profils -------------------------------------------------
  const profilRows: Row[] = []
  for (const f of formations) {
    for (const profil of new Set(f.profils_entree)) {
      profilRows.push({ program_id: programIdByCode.get(f.code), profil })
    }
  }
  await insertBatched('program_profils', profilRows, {
    onConflict: 'program_id,profil',
  })
  inserted['program_profils'] = profilRows.length

  // --- 5 & 6. tables enfants : remplacement pour les programs importés ----
  // Pas de clé naturelle, donc pas d'upsert possible : on purge puis insère.
  // Supprimer les secteurs emporte leurs employeurs par CASCADE.
  for (const table of ['competences', 'metiers', 'secteurs']) {
    for (const ids of chunkIn(programIds)) {
      await rest(`${table}?program_id=in.(${ids.join(',')})`, {
        method: 'DELETE',
        prefer: 'return=minimal',
      })
    }
  }

  const competenceRows: Row[] = []
  const metierRows: Row[] = []
  for (const f of formations) {
    const programId = programIdByCode.get(f.code)
    f.competences.forEach((libelle, i) => {
      competenceRows.push({ program_id: programId, ordre: i + 1, libelle })
    })
    f.metiers.forEach((libelle, i) => {
      metierRows.push({ program_id: programId, ordre: i + 1, libelle })
    })
  }

  await insertBatched('competences', competenceRows)
  inserted['competences'] = competenceRows.length
  await insertBatched('metiers', metierRows)
  inserted['metiers'] = metierRows.length

  // secteurs d'abord, pour récupérer leurs ids, puis les employeurs.
  const secteurRows: Row[] = []
  const secteurKeys: Array<{ code: string; ordre: number; employeurs: string[] }> = []
  for (const f of formations) {
    const programId = programIdByCode.get(f.code)
    f.secteurs.forEach((s, i) => {
      secteurRows.push({ program_id: programId, ordre: i + 1, nom: s.secteur })
      secteurKeys.push({ code: f.code, ordre: i + 1, employeurs: s.employeurs })
    })
  }

  const secteurs = await insertBatched('secteurs', secteurRows, { returning: true })
  inserted['secteurs'] = secteurs.length

  const secteurIdByKey = new Map(
    secteurs.map((s) => [`${s.program_id} ${s.ordre}`, s.id as string]),
  )

  const employeurRows: Row[] = []
  for (const key of secteurKeys) {
    const secteurId = secteurIdByKey.get(
      `${programIdByCode.get(key.code)} ${key.ordre}`,
    )
    if (!secteurId) {
      warnings.push(`secteur introuvable après insertion : ${key.code} ordre ${key.ordre}`)
      continue
    }
    key.employeurs.forEach((libelle, i) => {
      employeurRows.push({ secteur_id: secteurId, ordre: i + 1, libelle })
    })
  }

  await insertBatched('employeurs', employeurRows)
  inserted['employeurs'] = employeurRows.length

  // --- Rapport ------------------------------------------------------------
  console.log('\n=== Lignes écrites par table ===')
  for (const [table, count] of Object.entries(inserted)) {
    console.log(`  ${table.padEnd(32)} ${String(count).padStart(5)}`)
  }

  console.log('\n=== Sigles non rattachés ===')
  if (ignoredBySigle.size === 0) {
    console.log('  aucun : les 270 liens ont trouvé leur établissement')
  } else {
    for (const [sigle, count] of [...ignoredBySigle].sort()) {
      const deliberate = SIGLE_TO_NAME[sigle] === null
      console.log(
        `  ${sigle.padEnd(16)} ${String(count).padStart(3)} lien(s) ignoré(s)` +
          (deliberate ? '  (volontaire, aucune institution créée)' : '  (SIGLE INCONNU)'),
      )
    }
  }

  // Compétences insérées vs nb_competences_extrait du JSON.
  const ecarts = formations.filter(
    (f) =>
      f.nb_competences_extrait !== null &&
      f.nb_competences_extrait !== f.competences.length,
  )
  console.log('\n=== Écarts compétences insérées / nb_competences_extrait ===')
  if (ecarts.length === 0) {
    console.log('  aucun écart sur les 200 formations')
  } else {
    for (const f of ecarts) {
      console.log(
        `  ${f.code}  ${f.intitule}` +
          `  inséré ${f.competences.length}, déclaré ${f.nb_competences_extrait}`,
      )
    }
  }

  if (warnings.length) {
    console.log('\n=== Avertissements ===')
    for (const w of warnings) console.log(`  ${w}`)
  }

  console.log('\nImport terminé.\n')
}

main().catch((error) => {
  console.error('\nÉCHEC de l\'import :')
  console.error(error)
  process.exitCode = 1
})
