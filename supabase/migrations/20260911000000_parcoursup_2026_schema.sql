-- Schéma d'accueil des 200 formations ParcourSup Guinée 2026.
--
-- Migration ADDITIVE : aucun DELETE, aucun TRUNCATE, aucune colonne retirée.
-- La purge des 121 programs 2025 et des 116 departments est une étape séparée.
--
-- RLS : l'event trigger `ensure_rls` (fonction public.rls_auto_enable, sur
-- ddl_command_end) active RLS sur toute table créée dans `public`. On ne
-- déclare donc que les policies, comme les migrations précédentes.

-- ---------------------------------------------------------------------------
-- 1. Enums — valeurs relevées dans data/out/parcoursup-2026-09-11.json
--    (extrait le 2026-09-11, 200 formations, aucun null).
--    Les apostrophes sont reproduites à l'identique : U+2019 dans
--    type_diplome, U+0027 dans categorie_formation.
-- ---------------------------------------------------------------------------

create type public.type_diplome as enum (
  'Licence professionnelle',   -- 124
  'Diplôme d’ingénieur',       --  28
  'Licence fondamentale',      --  26
  'DUT',                       --  14
  'Diplôme d’État',            --   6
  'Cycle préparatoire'         --   2
);

create type public.categorie_formation as enum (
  'Licence',                        -- 150
  'Diplôme d''État & Ingénierie',   --  34
  'DUT & Cycle préparatoire'        --  16
);

create type public.profil_entree as enum (
  'SE',     -- 153
  'SE-FA',  -- 152
  'SM',     -- 138
  'SS',     --  48
  'SS-FA'   --  48
);

-- ---------------------------------------------------------------------------
-- 2. ParcourSup ne publie ni faculté ni département : un rattachement
--    obligatoire forcerait à fabriquer 200 faux departments.
-- ---------------------------------------------------------------------------

alter table public.programs
  alter column department_id drop not null;

-- ---------------------------------------------------------------------------
-- 3. programs : colonnes issues du portail. `level` et son CHECK restent
--    inchangés — type_diplome_enum est plus fin et coexiste avec lui.
-- ---------------------------------------------------------------------------

alter table public.programs
  add column categorie          public.categorie_formation,
  add column type_diplome_enum  public.type_diplome,
  add column numero_source      integer,
  add column url_source         text,
  add column annee_source       integer default 2026,
  add column academic_unit_id   uuid references public.academic_units(id) on delete set null;

-- `code` existe déjà (121 lignes, toutes à null) : on n'ajoute que l'unicité.
-- Postgres autorise plusieurs null sous une contrainte UNIQUE, donc les 121
-- lignes actuelles passent. Le NOT NULL viendra après l'import des 200.
alter table public.programs
  add constraint programs_code_key unique (code);

-- ---------------------------------------------------------------------------
-- 4. institutions.sigle — nullable pour l'instant : les noms complets sont
--    absents des pages sources, l'appariement des 18 sigles se fera à la main.
-- ---------------------------------------------------------------------------

alter table public.institutions
  add column sigle text;

alter table public.institutions
  add constraint institutions_sigle_key unique (sigle);

-- ---------------------------------------------------------------------------
-- 5. Tables de détail des formations
-- ---------------------------------------------------------------------------

create table public.program_institutions (
  program_id     uuid not null references public.programs(id)     on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  primary key (program_id, institution_id)
);

create table public.program_profils (
  program_id uuid not null references public.programs(id) on delete cascade,
  profil     public.profil_entree not null,
  primary key (program_id, profil)
);

create table public.competences (
  id         uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  ordre      integer not null,
  libelle    text not null
);

create table public.metiers (
  id         uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  ordre      integer not null,
  libelle    text not null
);

create table public.secteurs (
  id         uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  ordre      integer not null,
  nom        text
);

create table public.employeurs (
  id         uuid primary key default gen_random_uuid(),
  secteur_id uuid not null references public.secteurs(id) on delete cascade,
  ordre      integer not null,
  libelle    text not null
);

-- Lecture publique, même forme que application_steps / program_documents :
-- tables de détail sans review_status propre.
create policy public_read on public.program_institutions for select to public using (true);
create policy public_read on public.program_profils      for select to public using (true);
create policy public_read on public.competences          for select to public using (true);
create policy public_read on public.metiers              for select to public using (true);
create policy public_read on public.secteurs             for select to public using (true);
create policy public_read on public.employeurs           for select to public using (true);

-- ---------------------------------------------------------------------------
-- 6. Index. Les clés primaires composites couvrent déjà la colonne de tête
--    (program_id), d'où les index sur la seconde colonne seulement.
--    programs(code) n'est pas créé : la contrainte programs_code_key ci-dessus
--    produit déjà un index btree sur cette colonne.
-- ---------------------------------------------------------------------------

create index idx_program_institutions_institution_id on public.program_institutions (institution_id);
create index idx_program_profils_profil              on public.program_profils      (profil);
create index idx_programs_type_diplome_enum          on public.programs             (type_diplome_enum);
create index idx_competences_program_id              on public.competences          (program_id);
create index idx_metiers_program_id                  on public.metiers              (program_id);
create index idx_secteurs_program_id                 on public.secteurs             (program_id);
create index idx_employeurs_secteur_id               on public.employeurs           (secteur_id);
