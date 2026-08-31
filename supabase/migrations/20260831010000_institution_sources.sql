-- Table de liaison entre un établissement et ses sources documentaires.
--
-- Le manque comblé : jusqu'ici une source n'était atteignable que par
-- admission_requirements.source_id ou fees.source_id, c'est-à-dire seulement
-- si elle justifiait un chiffre. Les 3 pages officielles de l'UGANC — celles
-- qui ont servi à vérifier l'établissement lui-même — n'apparaissaient donc
-- nulle part sur sa fiche. C'est exactement l'inverse de ce que la règle de
-- traçabilité du projet demande : la source la plus fiable était la seule
-- invisible.
--
-- CHOIX : la table porte un review_status, comme institution_photos et les 6
-- tables du catalogue. Une liaison publie une URL sur une fiche publique ;
-- laisser un contributeur y rattacher n'importe quel lien sans relecture
-- ouvrirait la porte au même risque que les images. Le garder rend aussi la
-- table utilisable telle quelle par la fabrique de handlers (lib/api/crud.ts)
-- et par RowActions, sans cas particulier.
--
-- Pas de champ de fiabilité ici : elle appartient à la source
-- (source_type + status) et ne doit pas pouvoir diverger entre deux
-- rattachements de la même source.

create table institution_sources (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete cascade,
  -- `restrict` et non `cascade` : supprimer une source ne doit pas effacer
  -- silencieusement ses rattachements. Le handler DELETE de /sources compte
  -- déjà les références avant d'agir.
  source_id uuid not null references sources(id) on delete restrict,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  -- Une même source ne se rattache qu'une fois au même établissement.
  unique (institution_id, source_id)
);

create index institution_sources_institution_id_idx
  on institution_sources (institution_id);

alter table institution_sources enable row level security;

-- Lecture publique : liaison approuvée ET établissement approuvé, comme pour
-- institution_photos. Une fiche non publiée n'expose pas ses sources.
create policy public_read on institution_sources for select
  to anon, authenticated
  using (
    review_status = 'approved'
    and exists (
      select 1 from institutions i
      where i.id = institution_sources.institution_id
        and i.review_status = 'approved'
    )
  );

create policy staff_read_all on institution_sources for select
  to authenticated
  using (public.has_role('admin') or public.has_role('contributeur'));

create policy contributeur_insert on institution_sources for insert
  to authenticated
  with check (
    (public.has_role('contributeur') or public.has_role('admin'))
    and created_by = auth.uid()
    and review_status = 'pending'
  );

create policy contributeur_update_own_pending on institution_sources for update
  to authenticated
  using (created_by = auth.uid() and review_status = 'pending')
  with check (created_by = auth.uid() and review_status = 'pending');

create policy admin_update on institution_sources for update
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy admin_delete on institution_sources for delete
  to authenticated
  using (public.has_role('admin'));
