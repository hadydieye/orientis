-- RBAC contribution : rôles CONTRIBUTEUR / ADMIN via table user_roles (pas de custom JWT claim,
-- cf. décision documentée dans le résumé de session — pas de config Auth Hook nécessaire,
-- tout se provisionne en SQL pur).
--
-- Note : la colonne de workflow s'appelle "review_status" (et non "status") car
-- institutions.status existe déjà avec un tout autre sens (universite/institut/ecole,
-- cf. schéma initial) — réutiliser "status" créerait une collision sémantique.

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('contributeur', 'admin')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table user_roles enable row level security;

create policy select_own_roles on user_roles for select
  to authenticated
  using (user_id = auth.uid());

-- SECURITY DEFINER : nécessaire ici pour que la fonction puisse lire user_roles depuis
-- l'intérieur d'une policy RLS sur une autre table, indépendamment des droits de lecture
-- de l'appelant sur user_roles (qui ne voit que sa propre ligne).
create or replace function public.has_role(_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = _role
  )
$$;

revoke all on function public.has_role(text) from public;
grant execute on function public.has_role(text) to authenticated;

-- Colonnes de workflow de contribution sur les 6 tables du catalogue.
alter table institutions
  add column review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  add column created_by uuid references auth.users(id) on delete set null;

alter table academic_units
  add column review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  add column created_by uuid references auth.users(id) on delete set null;

alter table departments
  add column review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  add column created_by uuid references auth.users(id) on delete set null;

alter table programs
  add column review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  add column created_by uuid references auth.users(id) on delete set null;

alter table admission_requirements
  add column review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  add column created_by uuid references auth.users(id) on delete set null;

alter table fees
  add column review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  add column created_by uuid references auth.users(id) on delete set null;

-- Backfill : les données UGANC déjà en base ont été vérifiées manuellement avant cette
-- migration (source officielle) — elles ne doivent pas repasser par la file de modération.
update institutions set review_status = 'approved' where review_status = 'pending';
update academic_units set review_status = 'approved' where review_status = 'pending';
update departments set review_status = 'approved' where review_status = 'pending';
update programs set review_status = 'approved' where review_status = 'pending';

-- public_read ne doit plus exposer les contributions en attente de validation.
drop policy public_read on institutions;
create policy public_read on institutions for select using (review_status = 'approved');

drop policy public_read on academic_units;
create policy public_read on academic_units for select using (review_status = 'approved');

drop policy public_read on departments;
create policy public_read on departments for select using (review_status = 'approved');

drop policy public_read on programs;
create policy public_read on programs for select using (review_status = 'approved');

drop policy public_read on admission_requirements;
create policy public_read on admission_requirements for select using (review_status = 'approved');

drop policy public_read on fees;
create policy public_read on fees for select using (review_status = 'approved');

-- INSERT réservé aux CONTRIBUTEUR : statut forcé à 'pending', propriété forcée à l'auteur.
create policy contributeur_insert on institutions for insert
  to authenticated
  with check (public.has_role('contributeur') and review_status = 'pending' and created_by = auth.uid());

create policy contributeur_insert on academic_units for insert
  to authenticated
  with check (public.has_role('contributeur') and review_status = 'pending' and created_by = auth.uid());

create policy contributeur_insert on departments for insert
  to authenticated
  with check (public.has_role('contributeur') and review_status = 'pending' and created_by = auth.uid());

create policy contributeur_insert on programs for insert
  to authenticated
  with check (public.has_role('contributeur') and review_status = 'pending' and created_by = auth.uid());

create policy contributeur_insert on admission_requirements for insert
  to authenticated
  with check (public.has_role('contributeur') and review_status = 'pending' and created_by = auth.uid());

create policy contributeur_insert on fees for insert
  to authenticated
  with check (public.has_role('contributeur') and review_status = 'pending' and created_by = auth.uid());

-- UPDATE de validation réservé aux ADMIN (approbation/rejet, toute ligne).
create policy admin_update on institutions for update
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy admin_update on academic_units for update
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy admin_update on departments for update
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy admin_update on programs for update
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy admin_update on admission_requirements for update
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy admin_update on fees for update
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- UPDATE limité au CONTRIBUTEUR auteur, tant que sa soumission est encore en attente
-- (nécessaire pour PATCH /institutions/:id (CONTRIBUTEUR), au-delà de la validation admin).
-- Institutions uniquement : c'est la seule route PATCH contributeur demandée à ce stade.
create policy contributeur_update_own_pending on institutions for update
  to authenticated
  using (created_by = auth.uid() and review_status = 'pending')
  with check (created_by = auth.uid() and review_status = 'pending');
