# Orientis

Catalogue de l'enseignement supérieur guinéen : établissements, formations, conditions d'admission — avec un parcours d'orientation qui propose des filières à partir de la série du bac et de la moyenne.

**Principe fondateur : la traçabilité.** Chaque chiffre affiché porte sa source et le niveau de fiabilité de cette source. Un seuil d'admission issu d'une compilation communautaire ne s'affiche jamais sans la mention « Non-officiel, à vérifier ». Quand une donnée manque, la case reste vide plutôt que d'être comblée par approximation : une case vide dit que l'information n'a pas été trouvée, pas qu'elle n'existe pas.

Ce README décrit l'état **réel** du projet, vérifié par requêtes et par build, pas l'état visé. La section « Limites connues » n'est pas une formalité : c'est la partie la plus importante du document.

---

## Stack

| | |
|---|---|
| Framework | Next.js **16.3.3** (App Router, Turbopack), React **19.2.8** |
| Langage | TypeScript 5 |
| Styles | Tailwind CSS **v4** — pas de `tailwind.config.ts`, la configuration vit dans `app/globals.css` via `@theme inline` |
| Base / Auth / Storage | Supabase (PostgreSQL managé, RLS, Auth, Storage) |
| Clients Supabase | `@supabase/supabase-js` 2.109, `@supabase/ssr` 0.12.5 |
| Cartographie | `d3-geo` + `topojson-client` (world-atlas / Natural Earth) |
| Icônes | `lucide-react` |

Pas de backend séparé : toute la logique passe par les Route Handlers Next.js et les policies RLS. Le design system interne s'appelle **Aurora Glass** (glassmorphisme sombre, indigo/cyan/violet, Plus Jakarta Sans) et est démontré sur `/design-system`.

### Contrainte de performance assumée

Le public visé se connecte majoritairement depuis des Android d'entrée de gamme sur réseau instable. Deux règles en découlent, appliquées partout :

- `backdrop-filter` réservé à la navbar, aux hero, aux modales et aux cartes uniques. Les grilles denses (jusqu'à 108 cartes) utilisent un fond plat `rgba(255,255,255,.05)` — `blur={false}` sur `GlassCard`.
- Micro-interactions de 150 à 300 ms, `ease-out`, jamais plus de 400 ms, une seule chose en mouvement à la fois, `prefers-reduced-motion` respecté.

---

## Démarrage

```bash
git clone https://github.com/hadydieye/orientis.git
cd orientis
npm install
npm run dev
```

Créer `.env.local` à la racine (jamais commité, couvert par `.gitignore` depuis le commit initial) :

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé anon>
SUPABASE_SERVICE_ROLE_KEY=<clé service_role>
```

> Il n'y a pas de `.env.example` dans le dépôt : les trois variables ci-dessus sont la liste complète.

`next.config.ts` autorise le hostname Supabase pour `next/image`. Sans cette entrée, toute balise `<Image>` pointant vers le bucket échoue à l'exécution — un changement de projet Supabase impose donc de modifier ce fichier.

### Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run lint` | ESLint |
| `npm run generate:map` | régénère `components/home/guinea-geometry.ts` depuis Natural Earth |

### Base de données

Les 13 migrations de `supabase/migrations/` s'appliquent dans l'ordre chronologique via l'éditeur SQL du dashboard Supabase. Le CLI Supabase n'est pas utilisé.

---

## Arborescence réelle

```
orientis/
├── app/
│   ├── (site)/                    # groupe public : navbar + AuroraBackground
│   │   ├── page.tsx               # accueil
│   │   ├── explorer/              # catalogue des établissements
│   │   ├── formations/            # index filtrable + fiches [id]
│   │   ├── etablissements/[id]/   # fiche établissement
│   │   ├── orientation/           # parcours 3 étapes + /score (formule publiée)
│   │   ├── a-propos/
│   │   └── design-system/
│   ├── connexion/                 # hors groupe (site)
│   ├── admin/                     # back-office, layout propre (ni aurora ni blur)
│   │   ├── institutions/ unites/ departements/ formations/
│   │   ├── admissions/ frais/ sources/ utilisateurs/
│   │   ├── <table>/[id]/approve|reject/    # segments littéraux, un dossier par table
│   │   ├── cascade/[table]/[id]/           # comptes de suppression en cascade
│   │   └── users/[id]/roles/[role]/        # attribution / retrait de rôle
│   ├── <table>/route.ts           # API REST par table (GET, POST)
│   ├── <table>/[id]/route.ts      # GET, PATCH, DELETE
│   ├── profile/route.ts           # profil étudiant (cookie anonyme ou compte)
│   └── not-found.tsx              # 404 personnalisée, à la racine
├── components/
│   ├── ui/            # GlassCard, GlassButton, GlassInput, GlassSelect, GlassBadge, GlassPanel
│   ├── layout/        # Navbar, AuroraBackground
│   ├── home/          # Hero, GuineaOutline, StatsBar, CategoryGrid, InstitutionCard, FinalCta
│   ├── explorer/      # ExplorerCatalog, InstitutionListCard
│   ├── formations/    # ProgramsCatalog, ProgramListCard
│   ├── institution/   # UnitAccordion, ProgramCard, PhotoGallery
│   ├── program/       # SourceReliability (ReliabilityTag, ReliabilityBadge)
│   ├── orientation/   # OrientationFlow, OrientationStepper, RecommendationCard, RefineProfile
│   └── admin/         # AdminSidebar, EntityForm, RowActions, DeleteConfirmModal,
│                      # LogoUploader, PhotosManager, SourceTag, forms/<Table>Fields.tsx
├── lib/
│   ├── api/crud.ts            # fabrique de handlers CRUD (7 tables)
│   ├── api/sources.ts         # handlers sources + comptage des références
│   ├── api/users.ts           # liste des comptes + comptage des admins
│   ├── auth/admin.ts          # session back-office
│   ├── orientation/score.ts   # formule de score (module pur, testable)
│   ├── storage/compress.ts    # compression image navigateur (module pur)
│   ├── storage/images.ts      # upload logo / photos
│   ├── queries/               # lectures : home, institutions, programs, *-detail, admin*
│   └── database.types.ts      # types Supabase
├── supabase/migrations/       # 13 fichiers SQL
├── scripts/generate-guinea-map.mjs
└── "données orientix"         # fichier source communautaire (nom avec espace)
```

---

## Modèle de données

### Catalogue

`institutions` → `academic_units` → `departments` → `programs`, puis par formation et par année : `admission_requirements`, `fees`, `application_procedures` / `application_steps`, `documents` / `program_documents`.

Autour : `sources` (type `officiel` / `etudiant` / `tiers`, statut `verifie` / `a_verifier` / `obsolete`), `academic_years`, `institution_photos`, `institution_sources`.

Applicatif : `student_profiles` (série, moyenne, intérêts, ville, budget — anonyme par cookie ou lié à un compte), `user_roles`.

### Modération (RBAC)

Huit tables partagent le même mécanisme `review_status` (`pending` / `approved` / `rejected`) + `created_by` : les six du catalogue, plus `institution_photos` et `institution_sources`.

| Policy | Effet |
|---|---|
| `public_read` | le public ne voit que les lignes `approved` |
| `staff_read_all` | admin et contributeur voient aussi `pending` / `rejected` |
| `contributeur_insert` | création autorisée, ligne **forcée** en `pending` côté serveur |
| `contributeur_update_own_pending` | l'auteur corrige sa soumission tant qu'elle est `pending`, plus rien après |
| `admin_update` | modération |
| `admin_delete` | suppression, admin uniquement |

Le serveur retire du corps de requête les champs de workflow (`review_status`, `created_by`, `id`, `created_at`) : envoyer `review_status: "approved"` à la création n'a aucun effet, la ligne repart en `pending`.

**Piège rencontré, et traité :** sous RLS, un `DELETE` ou un `UPDATE` non autorisé renvoie **HTTP 200 avec un tableau vide** et la ligne survit — un faux succès. Les handlers relisent donc la ligne et renvoient un 403 explicite au lieu d'annoncer une réussite.

### Storage

Bucket `institution-images`, public en lecture, 2 Mo max, `image/webp|jpeg|png`. Arborescence `{institution_id}/logo.{ext}` et `{institution_id}/photos/{uuid}.{ext}`. Écriture réservée au staff, suppression aux admins (policies sur `storage.objects`).

Les images sont redimensionnées à 1200 px et converties en WebP **dans le navigateur** avant envoi. Si le ré-encodage alourdit le fichier — cas courant d'un logo PNG en aplats — l'original est conservé, sauf s'il dépassait 1200 px : au-delà, la version réduite gagne même plus lourde, parce qu'une image 3000×2000 coûte 24 Mo de bitmap à décoder sur un téléphone d'entrée de gamme.

---

## Moteur de recommandation

RPC `recommend_programs(p_series text, p_average numeric)` → `setof programs`. Elle ne renvoie **aucun score** : elle filtre, rien de plus. Un seuil `NULL` vaut « non exclusion », jamais rejet silencieux.

Le score est calculé côté application dans `lib/orientation/score.ts`, et **n'est jamais un pourcentage**. Rien en base ne permettrait d'en calculer un : ni statistiques d'admission, ni nombre de places, ni historique de candidatures. C'est un **compte de critères vérifiables**, chacun affiché avec sa justification :

```
+2  série explicitement acceptée
+2  seuil connu ET atteint
+1  seuil issu d'une source officielle vérifiée
+1  établissement dans la ville souhaitée
+1  domaine parmi les intérêts déclarés
```

Le maximum est **adaptatif** : un critère lié à une préférence non déclarée sort du total, pour que ne pas répondre à une question facultative ne pénalise pas toutes les formations. En revanche une donnée manquante **en base** reste comptée et rapporte 0 — le manque doit se voir.

La formule complète, la table intérêt → domaine et cet avertissement sont publiés sur **`/orientation/score`**, liée depuis chaque carte de résultat.

---

## Données

Deux origines, jamais mélangées :

1. **Sites officiels** (UGANC) — `officiel` / `verifie`, avec l'URL et la date de consultation.
2. **Compilation communautaire** (`données orientix`) — origine non identifiable, traitée en `tiers` / `a_verifier`, avec un disclaimer standard sur chaque ligne produite.

Le fichier source est inclus dans le dépôt à titre de trace. Il mélange formes Unicode NFC et NFD et utilise des codepoints « Mathematical Sans-Serif Bold » : tout parsing doit replier ces caractères avant de chercher quoi que ce soit, sans quoi la moitié des correspondances est manquée silencieusement.

### État réel du catalogue

| Table | Lignes | | Table | Lignes |
|---|---|---|---|---|
| `institutions` | **16** | | `institution_sources` | **4** |
| `academic_units` | **27** | | `sources` | **5** |
| `departments` | **103** | | `academic_years` | **1** |
| `programs` | **108** | | `fees` | **0** |
| `admission_requirements` | **81** | | `application_procedures` / `_steps` | **0** |
| `institution_photos` | **0** | | `documents` / `program_documents` | **0** |

Intégrité vérifiée : 0 ligne orpheline sur les 9 relations, 0 doublon, 0 `min_average` hors [0,20], 0 série inconnue, 0 condition sans source.

---

## Limites connues

Rien de ce qui suit n'est masqué dans l'interface, mais tout est réel.

**Complétude des formations**

- **51 / 108** ont des séries acceptées renseignées ; **66 / 108** un seuil de moyenne
- **27 / 108** n'ont **aucune** condition d'admission
- **64 / 108** n'ont ni description, ni programme, ni débouchés — fiche publique sans texte
- **105 / 108** n'ont pas de `domain` : le critère « intérêts » du score est donc quasi inerte

**Établissements**

- **0 / 16** ont un logo ou une photo ; **15 / 16** n'ont pas de site web ; **16 / 16** n'ont ni téléphone ni e-mail
- **0 / 16** ont des coordonnées GPS : les colonnes `latitude`/`longitude` sont inutilisées, la carte d'accueil s'appuie sur des coordonnées de villes générées par script
- L'Université Numérique de Guinée n'a ni ville ni formation rattachée — elle est donc absente du décompte par ville de l'accueil, qui affiche 15 établissements sur 16

**Fiabilité**

- Les **81** conditions d'admission proviennent **toutes** de la source `tiers` / `a_verifier`. Aucun seuil n'a été confirmé auprès d'un établissement.
- Un étudiant ne peut savoir **ni le coût ni la procédure d'inscription** d'aucune formation : `fees` et `application_procedures` sont vides. La compilation communautaire ne contient aucun montant, et sa seule procédure décrit « Parcoursup » — la plateforme française, sans rapport avec la Guinée — donc écartée.
- `/etablissements/[id]` affiche « Tiers · à vérifier » au lieu du libellé partagé « Non-officiel, à vérifier » : deux vocabulaires pour la même notion.

**Technique**

- `institution_sources` n'a **aucune interface** : les liaisons ne sont administrables que par appel API direct.
- `GET /recommendations` n'est référencée nulle part — route morte (le parcours utilise une server action).
- Un seul compte administrateur existe : en perdre l'accès fermerait le back-office.

---

## Rôles

| Rôle | Droits |
|---|---|
| Visiteur | catalogue public, parcours d'orientation et profil sans compte (cookie) |
| Utilisateur inscrit | + profil rattaché au compte |
| `contributeur` | + création, et correction de ses propres soumissions tant qu'elles sont `pending` |
| `admin` | + approuver / rejeter / supprimer, gérer les sources et les rôles |

Les rôles se gèrent depuis `/admin/utilisateurs`. Le retrait du **dernier** rôle admin du système est refusé, quel que soit le compte visé : le back-office ne peut pas se verrouiller par accident.

---

## État du build

`npm run build` — **exit 0**, aucun warning. `tsc --noEmit` et `eslint` propres.
71 routes, dont 108 fiches formation et 16 fiches établissement pré-générées (SSG + ISR 1 h).

> Piège Next.js : une page prerendue qui lit `useSearchParams` **doit** être sous une frontière `<Suspense>`, sinon le build de production échoue — le mode dev ne le signale pas.

---

## Licence

Projet personnel — Mohamed Hady Diallo ([0xLearn GN](https://github.com/hadydieye)). Aucun fichier `LICENSE` n'est encore présent dans le dépôt.
